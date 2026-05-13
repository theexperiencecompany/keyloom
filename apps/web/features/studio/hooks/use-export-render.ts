"use client";

import type { Project } from "@workspace/compositions/project";
import { useCallback, useRef, useState } from "react";
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
};

/**
 * Drives the in-browser MP4 export. The actual frame-walking +
 * encoding lives in `../lib/browser-export.ts` — this hook just owns
 * the UI state machine and a cancel token so re-clicking Export
 * mid-flight doesn't run two encoders concurrently.
 */
export function useExportRender() {
  const [state, setState] = useState<ExportState>({
    phase: "idle",
    progress: 0,
    error: null,
  });

  // Generation counter — bumped on reset/start, used to ignore stale
  // progress callbacks if the user dismisses the overlay mid-render.
  const generationRef = useRef(0);

  const reset = useCallback(() => {
    generationRef.current += 1;
    setState({ phase: "idle", progress: 0, error: null });
  }, []);

  const start = useCallback(async (project: Project) => {
    const myGeneration = ++generationRef.current;

    if (!isBrowserExportSupported()) {
      setState({
        phase: "error",
        progress: 0,
        error:
          "Your browser does not support in-browser MP4 export (WebCodecs unavailable). Try the latest Chrome or Edge.",
      });
      return;
    }

    setState({ phase: "starting", progress: 0, error: null });

    // Give React one tick to paint the "Preparing render…" UI before the
    // encoder hogs the main thread.
    await new Promise<void>((r) => setTimeout(r, 0));
    if (generationRef.current !== myGeneration) return;

    setState({ phase: "rendering", progress: 0, error: null });

    try {
      const blob = await renderProjectInBrowser({
        project,
        onProgress: (progress) => {
          if (generationRef.current !== myGeneration) return;
          setState({ phase: "rendering", progress, error: null });
        },
      });

      if (generationRef.current !== myGeneration) return;

      setState({ phase: "done", progress: 1, error: null });
      downloadMp4Blob(blob, "project.mp4");
    } catch (e) {
      if (generationRef.current !== myGeneration) return;
      setState({
        phase: "error",
        progress: 0,
        error: e instanceof Error ? e.message : "Render failed",
      });
    }
  }, []);

  return { state, start, reset };
}
