"use client";

import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { useClipDurationInFrames } from "./clip-context";
import type { EffectInfo } from "./schema";

export type FadeOutProps = {
  durationInFrames: number;
  children?: React.ReactNode;
};

export function FadeOut({ durationInFrames, children }: FadeOutProps) {
  const frame = useCurrentFrame();
  const total = useClipDurationInFrames();
  const start = Math.max(0, total - durationInFrames);

  const opacity = interpolate(frame, [start, total - 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 1, 1),
  });

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
}

export const fadeOutInfo: EffectInfo<{
  durationInFrames: number;
}> = {
  id: "FadeOut",
  title: "Fade out",
  description: "Fade to transparent at the end of the clip",
  trigger: "exit",
  defaultProps: {
    durationInFrames: 18,
  },
  fields: [
    {
      kind: "number",
      key: "durationInFrames",
      label: "Duration (frames)",
      min: 2,
      max: 240,
    },
  ],
};
