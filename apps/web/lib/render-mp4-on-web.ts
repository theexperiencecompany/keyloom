"use client";

import type {
  renderMediaOnWeb,
  WebRendererHardwareAcceleration,
} from "@remotion/web-renderer";

type WebRenderArgs = Parameters<typeof renderMediaOnWeb>[0];
type WebRenderResult = Awaited<ReturnType<typeof renderMediaOnWeb>>;

// Hardware encoders reject some configs instead of falling back, and hardware
// encode/decode can crash mid-render with opaque internal errors ("x is not a
// function" from the codec worker). So every non-abort failure retries with the
// next acceleration setting. A deterministic error costs two extra attempts,
// and a flaky hardware encoder still finishes on the software setting.
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

export type RenderMp4OnWebArgs = {
  id: string;
  component: React.ComponentType<Record<string, unknown>>;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  inputProps: Record<string, unknown>;
  filenamePrefix: string;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
};

export async function renderMp4OnWeb({
  id,
  component,
  durationInFrames,
  fps,
  width,
  height,
  inputProps,
  filenamePrefix,
  signal,
  onProgress,
}: RenderMp4OnWebArgs): Promise<{ blob: Blob; filename: string }> {
  const result = await renderWithFallback({
    composition: {
      id,
      component,
      calculateMetadata: () => ({ durationInFrames, fps, width, height }),
    },
    inputProps,
    container: "mp4",
    videoCodec: "h264",
    signal: signal ?? null,
    onProgress: ({ progress }) => onProgress?.(progress),
  });

  const blob = await result.getBlob();
  const filename = `${filenamePrefix}-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19)}.mp4`;
  return { blob, filename };
}
