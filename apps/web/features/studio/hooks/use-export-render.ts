"use client";

import type { Project } from "@workspace/compositions/project";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_EXPORT_OPTIONS,
  type ExportOptions,
} from "../lib/export-options";
import { downloadRemoteUrl, renderProjectOnLambda } from "../lib/lambda-export";
import {
  downloadMp4Blob,
  isLocalExportSupported,
  renderProjectLocally,
} from "../lib/local-export";
import { renderProjectOnServer } from "../lib/server-export";

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
  /**
   * Set only for the Lambda ("exact") path: the presigned S3 URL of the
   * finished MP4. `state.blobUrl` points at this same URL so the overlay can
   * preview it, but it's a cross-origin remote URL (not an object URL), so
   * {@link download} must route it through the `/api/download` proxy instead
   * of `fetch`-ing it directly.
   */
  const remoteUrlRef = useRef<string | null>(null);
  const lastOptionsRef = useRef<ExportOptions>(DEFAULT_EXPORT_OPTIONS);

  const revokeBlobUrl = useCallback(() => {
    remoteUrlRef.current = null;
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
      remoteUrlRef.current = null;
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

  /**
   * Exact (WYSIWYG) export via the `/api/render` endpoint — real headless
   * Chromium, so `backdrop-filter` glass / WebGL survive. The endpoint returns
   * the whole MP4 at once, so there's no incremental progress: we sit in an
   * indeterminate "starting" phase (the overlay shows a pulsing bar) until the
   * blob arrives.
   */
  const startServer = useCallback(async (project: Project) => {
    const myGeneration = ++generationRef.current;
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    console.info("[export-hook] startServer", {
      width: project.width,
      height: project.height,
      fps: project.fps,
      clips: project.clips?.length,
    });

    const startedAt = Date.now();
    // Indeterminate: keep phase "starting" (pulsing bar) for the whole render.
    setState({
      ...INITIAL_STATE,
      phase: "starting",
      errorStack: null,
      startedAt,
    });

    try {
      const { blob, filename } = await renderProjectOnServer({
        project,
        signal: controller.signal,
      });

      if (generationRef.current !== myGeneration) return;

      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const finishedAt = Date.now();
      console.info(
        "[export-hook] server done",
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
        console.info("[export-hook] server cancelled");
        setState(INITIAL_STATE);
        return;
      }
      console.error("[export-hook] server failed", e);
      setState({
        ...INITIAL_STATE,
        phase: "error",
        error: err.message || "Server render failed",
        errorStack: err.stack ?? null,
        startedAt,
        finishedAt: Date.now(),
      });
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    }
  }, []);

  /**
   * Exact (WYSIWYG) export on AWS Lambda — real headless Chromium in the cloud,
   * so `backdrop-filter` glass / WebGL / bundled fonts (SF Pro) match the
   * Player exactly, without tying up the user's machine. Unlike the local
   * server path this reports real per-frame progress. The finished MP4 lives at
   * a presigned S3 URL: we stash it in `remoteUrlRef` (so {@link download}
   * proxies it through `/api/download`) and mirror it into `state.blobUrl` so
   * the overlay can preview it inline.
   */
  const startLambda = useCallback(
    async (project: Project, options?: ExportOptions) => {
      const resolved = options ?? DEFAULT_EXPORT_OPTIONS;
      lastOptionsRef.current = resolved;
      const myGeneration = ++generationRef.current;
      remoteUrlRef.current = null;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      const controller = new AbortController();
      controllerRef.current = controller;

      console.info("[export-hook] startLambda", {
        width: project.width,
        height: project.height,
        fps: project.fps,
        clips: project.clips?.length,
        preset: resolved.preset,
      });

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
        const { url, filename } = await renderProjectOnLambda({
          project,
          options: resolved,
          signal: controller.signal,
          onProgress: handleProgress,
        });

        if (generationRef.current !== myGeneration) return;

        remoteUrlRef.current = url;
        const finishedAt = Date.now();
        console.info(
          "[export-hook] lambda done in",
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
          console.info("[export-hook] lambda cancelled");
          setState(INITIAL_STATE);
          return;
        }
        console.error("[export-hook] lambda failed", e);
        setState({
          ...INITIAL_STATE,
          phase: "error",
          error: err.message || "Lambda render failed",
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
    const filename = state.filename ?? "project.mp4";
    // Lambda path: the result is a cross-origin presigned S3 URL, so route it
    // through our same-origin `/api/download` proxy (which sets
    // Content-Disposition: attachment) instead of fetching the blob directly.
    if (remoteUrlRef.current) {
      downloadRemoteUrl(remoteUrlRef.current, filename);
      return;
    }
    const url = blobUrlRef.current;
    if (!url) return;
    fetch(url)
      .then((r) => r.blob())
      .then((b) => downloadMp4Blob(b, filename))
      .catch((err) => console.error("[export-hook] download failed", err));
  }, [state.filename]);

  return { state, start, startServer, startLambda, reset, cancel, download };
}
