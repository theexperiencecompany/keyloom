"use client";

import type { CaptionedVideoProps } from "@workspace/compositions/compositions/CaptionedVideo/CaptionedVideo";
import { renderMp4OnWeb } from "@/lib/render-mp4-on-web";

export const CAPTION_FPS = 30;

export type CaptionExportArgs = {
  props: CaptionedVideoProps;
  width: number;
  height: number;
  durationInFrames: number;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
};

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
  return renderMp4OnWeb({
    id: "CaptionedVideo",
    component: CaptionedVideo as React.ComponentType<Record<string, unknown>>,
    durationInFrames,
    fps: CAPTION_FPS,
    width: Math.max(2, width - (width % 2)),
    height: Math.max(2, height - (height % 2)),
    inputProps: props as unknown as Record<string, unknown>,
    filenamePrefix: "captions",
    signal,
    onProgress,
  });
}
