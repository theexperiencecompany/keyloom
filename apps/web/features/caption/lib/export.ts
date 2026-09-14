"use client";

import type {
  renderMediaOnWeb,
  WebRendererHardwareAcceleration,
} from "@remotion/web-renderer";
import type { CaptionedVideoProps } from "@workspace/compositions/compositions/CaptionedVideo/CaptionedVideo";

export const CAPTION_FPS = 30;

export type CaptionExportArgs = {
  props: CaptionedVideoProps;
  width: number;
  height: number;
  durationInFrames: number;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
};

type WebRenderArgs = Parameters<typeof renderMediaOnWeb>[0];
type WebRenderResult = Awaited<ReturnType<typeof renderMediaOnWeb>>;

// Same ladder as the studio's local export: hardware encoders reject some
// configs outright instead of falling back — and hardware encode/decode can
// also crash mid-render with opaque internal errors ("x is not a function"
// from the codec worker). Retry the whole ladder on ANY non-abort failure:
// worst case a deterministic error costs two extra attempts, but a flaky
// hardware path gets rescued by the software rung.
const ACCELERATION_FALLBACK: WebRendererHardwareAcceleration[] = [
  "prefer-hardware",
  "no-preference",
  "prefer-software",
];

async function renderWithFallback(
  baseOptions: Omit<WebRenderArgs, "hardwareAcceleration">,
): Promise<WebRenderResult> {
  const { renderMediaOnWeb } = await import("@remotion/web-renderer");
  let lastError: unknown;
  for (const hardwareAcceleration of ACCELERATION_FALLBACK) {
    try {
      return await renderMediaOnWeb({ ...baseOptions, hardwareAcceleration });
    } catch (err) {
      lastError = err;
      if (baseOptions.signal?.aborted) throw err;
    }
  }
  throw lastError;
}

export async function exportCaptionedVideo({
  props,
  width,
  height,
  durationInFrames,
  signal,
  onProgress,
}: CaptionExportArgs): Promise<{ blob: Blob; filename: string }> {
  const { CaptionedVideo } = await import(
    "@workspace/compositions/compositions/CaptionedVideo/CaptionedVideo"
  );

  // H.264 requires even dimensions.
  const evenWidth = Math.max(2, width - (width % 2));
  const evenHeight = Math.max(2, height - (height % 2));

  const result = await renderWithFallback({
    composition: {
      id: "CaptionedVideo",
      component: CaptionedVideo as React.ComponentType<Record<string, unknown>>,
      calculateMetadata: () => ({
        durationInFrames,
        fps: CAPTION_FPS,
        width: evenWidth,
        height: evenHeight,
      }),
    },
    inputProps: props as unknown as Record<string, unknown>,
    container: "mp4",
    videoCodec: "h264",
    signal: signal ?? null,
    onProgress: ({ progress }) => onProgress?.(progress),
  });

  const blob = await result.getBlob();
  const filename = `captions-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19)}.mp4`;
  return { blob, filename };
}
