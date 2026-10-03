"use client";

import type { SplitStackProps } from "@workspace/compositions/compositions/SplitStack/SplitStack";
import { renderMp4OnWeb } from "@/lib/render-mp4-on-web";

export const SPLIT_FPS = 30;
export const SPLIT_WIDTH = 1080;
export const SPLIT_HEIGHT = 1920;

export type SplitExportArgs = {
  props: SplitStackProps;
  durationInFrames: number;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
};

export async function exportSplitVideo({
  props,
  durationInFrames,
  signal,
  onProgress,
}: SplitExportArgs): Promise<{ blob: Blob; filename: string }> {
  const { SplitStack } = await import(
    "@workspace/compositions/compositions/SplitStack/SplitStack"
  );

  return renderMp4OnWeb({
    id: "SplitStack",
    component: SplitStack as React.ComponentType<Record<string, unknown>>,
    durationInFrames,
    fps: SPLIT_FPS,
    width: SPLIT_WIDTH,
    height: SPLIT_HEIGHT,
    inputProps: props as unknown as Record<string, unknown>,
    filenamePrefix: "split",
    signal,
    onProgress,
  });
}
