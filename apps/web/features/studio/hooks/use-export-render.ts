"use client";

import type { Project } from "@workspace/compositions/project";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_EXPORT_OPTIONS,
  type ExportOptions,
} from "../lib/export-options";
import {
  downloadMp4Blob,
  isLocalExportSupported,
  renderProjectLocally,
} from "../lib/local-export";

export type ExportPhase = "idle" | "starting" | "rendering" | "done" | "error";

export type ExportState = {
  phase: ExportPhase;
  progress: number;
  error: string | null;
  errorStack?: string | null;
  blobUrl: string | null;
  filename: string | null;
  /** epoch-ms timestamp when the "rendering" phase began, or null. */
  startedAt: number | null;
  /** epoch-ms timestamp when the render terminated (done or error). */
  finishedAt: number | null;
};

const INITIAL_STATE: ExportState = {
  phase: "idle",
  progress: 0,
  error: null,
  blobUrl: null,
  filename: null,
  startedAt: null,
  finishedAt: null,
};

/**
 * Drives the in-browser MP4 export via `@remotion/web-renderer`. Owns the
 * UI state machine, a generation counter to discard stale callbacks, and an
 * AbortController so the modal can offer a Cancel button.
 */
export function useExportRender() {
  const [state, setState] = useState<ExportState>(INITIAL_STATE);

  const generationRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const lastOptionsRef = useRef<ExportOptions>(DEFAULT_EXPORT_OPTIONS);

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

  const start = useCallback(
    async (project: Project, options?: ExportOptions) => {
      const resolved = options ?? DEFAULT_EXPORT_OPTIONS;
      lastOptionsRef.current = resolved;
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
        preset: resolved.preset,
      });

      const supported = await isLocalExportSupported(project);
      if (generationRef.current !== myGeneration) return;
      if (!supported.ok) {
        setState({
          ...INITIAL_STATE,
          phase: "error",
          error:
            supported.reason ??
            "Your browser cannot render MP4 locally. Try the latest Chrome or Edge.",
          errorStack: null,
        });
        return;
      }

      setState({ ...INITIAL_STATE, phase: "starting", errorStack: null });

      await new Promise<void>((r) => setTimeout(r, 0));
      if (generationRef.current !== myGeneration) return;

      const startedAt = Date.now();
      setState({
        ...INITIAL_STATE,
        phase: "rendering",
        errorStack: null,
        startedAt,
      });

      const handleProgress = (progress: number) => {
        if (generationRef.current !== myGeneration) return;
        setState((prev) => ({
          ...prev,
          phase: "rendering",
          progress,
          error: null,
          errorStack: null,
          startedAt: prev.startedAt ?? startedAt,
        }));
      };

      try {
        const { blob, filename } = await renderProjectLocally({
          project,
          options: resolved,
          signal: controller.signal,
          onProgress: handleProgress,
        });

        if (generationRef.current !== myGeneration) return;

        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;

        const finishedAt = Date.now();
        console.info(
          "[export-hook] done",
          blob.size,
          "bytes in",
          ((finishedAt - startedAt) / 1000).toFixed(2),
          "s",
        );
        setState({
          phase: "done",
          progress: 1,
          error: null,
          errorStack: null,
          blobUrl: url,
          filename,
          startedAt,
          finishedAt,
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
          startedAt,
          finishedAt: Date.now(),
        });
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
      }
    },
    [],
  );

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
      revokeBlobUrl();
    },
    [revokeBlobUrl],
  );

  const download = useCallback(() => {
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
