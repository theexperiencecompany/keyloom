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
  type WebRendererHardwareAcceleration,
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

type WebRenderArgs = Parameters<typeof renderMediaOnWeb>[0];
type WebRenderResult = Awaited<ReturnType<typeof renderMediaOnWeb>>;

/**
 * `canRenderMediaOnWeb` can't probe `hardwareAcceleration`, so the feature
 * check passes while the actual hardware encoder still rejects a given config
 * (e.g. avc1.640029 @ 50 Mbps @ 1080p on a machine with no H.264 hardware
 * encode). `prefer-hardware` throws in that case instead of falling back, so
 * we try acceleration modes in order: hardware first (fast path), then let the
 * browser negotiate, then force software. The browser's software encoder
 * (Chrome's bundled OpenH264) handles configs the hardware path won't.
 */
const ACCELERATION_FALLBACK: WebRendererHardwareAcceleration[] = [
  "prefer-hardware",
  "no-preference",
  "prefer-software",
];

/** True when an error looks like a rejected WebCodecs encoder config (worth retrying with a different acceleration mode) rather than a genuine render failure. */
function isEncoderConfigError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /not supported by this browser|encoder configuration|hardware acceleration|configuration is not supported|isConfigSupported/i.test(
    msg,
  );
}

async function renderWithAccelerationFallback(
  baseOptions: Omit<WebRenderArgs, "hardwareAcceleration">,
): Promise<WebRenderResult> {
  let lastError: unknown;
  for (let i = 0; i < ACCELERATION_FALLBACK.length; i++) {
    const hardwareAcceleration = ACCELERATION_FALLBACK[i]!;
    try {
      return await renderMediaOnWeb({ ...baseOptions, hardwareAcceleration });
    } catch (err) {
      lastError = err;
      const signal = (baseOptions as { signal?: AbortSignal | null }).signal;
      // Respect user cancellation and don't retry genuine (non-config) errors.
      if (signal?.aborted) throw err;
      if (
        i === ACCELERATION_FALLBACK.length - 1 ||
        !isEncoderConfigError(err)
      ) {
        throw err;
      }
      const next = ACCELERATION_FALLBACK[i + 1];
      console.warn(
        `[export] H.264 encoder rejected "${hardwareAcceleration}"; retrying with "${next}".`,
        err,
      );
    }
  }
  throw lastError;
}

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

  // Scale the project's frame counts to the export fps. The project is
  // designed at `project.fps` (typically 60); each clip's
  // `durationInFrames` represents `durationInFrames / project.fps`
  // wall-clock seconds. To render the same wall-clock content at a
  // different fps, multiply every frame count by `exportFps / project.fps`
  // and tell Remotion the new fps. Compositions use `useDesignFrame()`
  // internally so their hardcoded timing constants stay tied to
  // wall-clock time regardless of the actual render fps.
  const exportFps = options.fps;
  const fpsScale = exportFps / project.fps;
  const scaledProject: Project =
    fpsScale === 1
      ? project
      : {
          ...project,
          fps: exportFps,
          clips: project.clips.map((c) => ({
            ...c,
            durationInFrames: Math.max(
              1,
              Math.round(c.durationInFrames * fpsScale),
            ),
            transition: c.transition
              ? {
                  ...c.transition,
                  durationInFrames: Math.max(
                    0,
                    Math.round(c.transition.durationInFrames * fpsScale),
                  ),
                }
              : c.transition,
          })),
          defaultTransition: project.defaultTransition
            ? {
                ...project.defaultTransition,
                durationInFrames: Math.max(
                  0,
                  Math.round(
                    project.defaultTransition.durationInFrames * fpsScale,
                  ),
                ),
              }
            : project.defaultTransition,
        };

  const result = await renderWithAccelerationFallback({
    composition: {
      id: "Project",
      component: ProjectComposition as React.ComponentType<
        Record<string, unknown>
      >,
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
    inputProps: scaledProject as unknown as Record<string, unknown>,
    container: "mp4",
    videoCodec: "h264",
    videoBitrate: options.bitrate,
    scale: Math.min(2, Math.max(0.25, options.scale)),
    // Distance between H.264 keyframes (smaller = more keyframes = less
    // inter-frame prediction shimmer on at-rest text). The "high" preset
    // requests all-intra by setting this to the per-frame duration; we
    // clamp to >= 1/exportFps so it stays all-intra at whatever fps the
    // user picked (1/60s would only be every-other-frame at 120fps).
    keyframeIntervalInSeconds: Math.max(
      options.keyframeIntervalSec,
      1 / exportFps,
    ),
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
