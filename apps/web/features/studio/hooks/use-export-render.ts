"use client";

import type { Project } from "@workspace/compositions/project";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  downloadMp4Blob,
  isBrowserExportSupported,
  renderProjectInBrowser,
} from "../lib/browser-export";

export type ExportPhase = "idle" | "starting" | "rendering" | "done" | "error";

export type ExportState = {
  phase: ExportPhase;
  progress: number;
  error: string | null;
  errorStack?: string | null;
  /**
   * Object URL of the rendered MP4 once `phase === "done"`. Kept alive so
   * the export modal can show a playable preview and a manual download
   * button; revoked when `reset()` is called.
   */
  blobUrl: string | null;
  /** Filename suggested for the download. */
  filename: string | null;
};

const INITIAL_STATE: ExportState = {
  phase: "idle",
  progress: 0,
  error: null,
  blobUrl: null,
  filename: null,
};

/**
 * Drives the in-browser MP4 export. The actual frame-walking +
 * encoding lives in `../lib/browser-export.ts` — this hook owns the UI
 * state machine, a generation counter to discard stale callbacks, and
 * an AbortController so the modal can offer a Cancel button.
 */
export function useExportRender() {
  const [state, setState] = useState<ExportState>(INITIAL_STATE);

  // Generation counter — bumped on reset/start, used to ignore stale
  // progress callbacks if the user dismisses the overlay mid-render.
  const generationRef = useRef(0);
  // Live abort controller for the in-flight render, so the modal's
  // Cancel button can stop the frame loop between frames.
  const controllerRef = useRef<AbortController | null>(null);
  // Keep the latest blob URL on a ref too so reset() can revoke it
  // without depending on a stale state closure.
  const blobUrlRef = useRef<string | null>(null);

  const revokeBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    generationRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    revokeBlobUrl();
    setState(INITIAL_STATE);
  }, [revokeBlobUrl]);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  const start = useCallback(async (project: Project) => {
    const myGeneration = ++generationRef.current;
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    console.info("[export-hook] start", {
      width: project.width,
      height: project.height,
      fps: project.fps,
      clips: project.clips?.length,
    });

    if (!isBrowserExportSupported()) {
      console.warn("[export-hook] WebCodecs unavailable");
      setState({
        ...INITIAL_STATE,
        phase: "error",
        error:
          "Your browser does not support in-browser MP4 export (WebCodecs unavailable). Try the latest Chrome or Edge.",
        errorStack: null,
      });
      return;
    }

    setState({
      ...INITIAL_STATE,
      phase: "starting",
      errorStack: null,
    });

    // Give React one tick to paint the "Preparing render…" UI before the
    // encoder hogs the main thread.
    await new Promise<void>((r) => setTimeout(r, 0));
    if (generationRef.current !== myGeneration) return;

    setState({
      ...INITIAL_STATE,
      phase: "rendering",
      errorStack: null,
    });

    try {
      const blob = await renderProjectInBrowser({
        project,
        signal: controller.signal,
        onProgress: (progress) => {
          if (generationRef.current !== myGeneration) return;
          setState((prev) => ({
            ...prev,
            phase: "rendering",
            progress,
            error: null,
            errorStack: null,
          }));
        },
      });

      if (generationRef.current !== myGeneration) return;

      const filename = `motion-studio-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19)}.mp4`;
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      console.info("[export-hook] done", blob.size, "bytes");
      setState({
        phase: "done",
        progress: 1,
        error: null,
        errorStack: null,
        blobUrl: url,
        filename,
      });
    } catch (e) {
      if (generationRef.current !== myGeneration) return;
      const err = e instanceof Error ? e : new Error(String(e));
      if (err.name === "AbortError") {
        console.info("[export-hook] cancelled");
        setState(INITIAL_STATE);
        return;
      }
      console.error("[export-hook] failed", e);
      setState({
        ...INITIAL_STATE,
        phase: "error",
        error: err.message || "Render failed",
        errorStack: err.stack ?? null,
      });
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    }
  }, []);

  // Revoke any held blob URL when the consumer unmounts.
  useEffect(() => () => revokeBlobUrl(), [revokeBlobUrl]);

  const download = useCallback(() => {
    // Fetch the URL and re-trigger a download via anchor — keeps a single
    // pathway and uses `downloadMp4Blob`'s filename UX.
    const url = blobUrlRef.current;
    const filename = state.filename ?? "project.mp4";
    if (!url) return;
    fetch(url)
      .then((r) => r.blob())
      .then((b) => downloadMp4Blob(b, filename))
      .catch((err) => console.error("[export-hook] download failed", err));
  }, [state.filename]);

  return { state, start, reset, cancel, download };
}
