"use client";

/**
 * Client-side MP4 export powered by Remotion's first-party
 * `@remotion/web-renderer`. Runs entirely in the user's browser:
 *   - composition mounted in an offscreen Remotion render canvas (handled
 *     internally by web-renderer; no html2canvas walk, no DOM rasterization),
 *   - WebCodecs hardware encoder produces H.264 chunks,
 *   - mediabunny muxes them into an MP4 Blob.
 *
 * No server, no bundle step — the studio just hands web-renderer the same
 * `ProjectComposition` React component and Project JSON the studio's Player
 * already uses, plus the same `calculateMetadata` we declared on the
 * Remotion `<Composition id="Project">` for duration/dimension inference.
 */

import {
  canRenderMediaOnWeb,
  type RenderMediaOnWebProgressCallback,
  renderMediaOnWeb,
} from "@remotion/web-renderer";
import { ProjectComposition } from "@workspace/compositions/compositions/Project/Project";
import { type Project, projectDuration } from "@workspace/compositions/project";

import type { ExportOptions } from "./export-options";

export type LocalExportResult = {
  blob: Blob;
  filename: string;
};

export type LocalExportArgs = {
  project: Project;
  options: ExportOptions;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
};

/**
 * Quick feature-detect for the export modal — checks WebGL + WebCodecs +
 * H.264 encoder availability at the project's resolution.
 */
export async function isLocalExportSupported(project: {
  width: number;
  height: number;
}): Promise<{ ok: boolean; reason?: string }> {
  if (typeof window === "undefined") return { ok: false, reason: "No DOM" };
  const result = await canRenderMediaOnWeb({
    width: project.width,
    height: project.height,
    container: "mp4",
    videoCodec: "h264",
  });
  if (result.canRender) return { ok: true };
  const first = result.issues.find((i) => i.severity === "error");
  return {
    ok: false,
    reason: first?.message ?? "Browser cannot render MP4 locally.",
  };
}

export async function renderProjectLocally({
  project,
  options,
  signal,
  onProgress,
}: LocalExportArgs): Promise<LocalExportResult> {
  const progress: RenderMediaOnWebProgressCallback = ({ progress: p }) => {
    onProgress?.(p);
  };

  const result = await renderMediaOnWeb({
    composition: {
      id: "Project",
      component: ProjectComposition as React.ComponentType<
        Record<string, unknown>
      >,
      // Mirror the calculateMetadata declared on <Composition id="Project">
      // in apps/remotion/src/Root.tsx so duration/dimensions are derived from
      // the live project JSON instead of needing a Remotion bundle.
      calculateMetadata: ({ props }) => {
        const p = props as Project;
        return {
          durationInFrames: projectDuration(p),
          fps: p.fps,
          width: p.width,
          height: p.height,
        };
      },
    },
    inputProps: project as unknown as Record<string, unknown>,
    container: "mp4",
    videoCodec: "h264",
    videoBitrate: options.bitrate,
    scale: Math.min(1, Math.max(0.25, options.scale)),
    hardwareAcceleration: "prefer-hardware",
    keyframeIntervalInSeconds: 1,
    signal: signal ?? null,
    onProgress: progress,
  });

  const blob = await result.getBlob();
  const filename = `motion-studio-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19)}.mp4`;
  return { blob, filename };
}

export function downloadMp4Blob(blob: Blob, filename = "project.mp4"): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
