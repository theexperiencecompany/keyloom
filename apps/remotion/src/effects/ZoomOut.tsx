"use client";

import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { useClipDurationInFrames } from "./clip-context";
import type { EffectInfo } from "./schema";

export type ZoomOutProps = {
  toScale: number;
  durationInFrames: number;
  children?: React.ReactNode;
};

export function ZoomOut({ toScale, durationInFrames, children }: ZoomOutProps) {
  const frame = useCurrentFrame();
  const total = useClipDurationInFrames();
  const start = Math.max(0, total - durationInFrames);

  const t = interpolate(frame, [start, total - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.55, 0, 1, 0.45),
  });

  const scale = interpolate(t, [0, 1], [1, toScale]);

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "center",
        opacity: 1 - t,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

export const zoomOutInfo: EffectInfo<{
  toScale: number;
  durationInFrames: number;
}> = {
  id: "ZoomOut",
  title: "Zoom out",
  description: "Scale + fade at the end. Set toScale > 1 to zoom forward.",
  trigger: "exit",
  defaultProps: {
    toScale: 0.6,
    durationInFrames: 24,
  },
  fields: [
    {
      kind: "number",
      key: "toScale",
      label: "To scale",
      min: 0.1,
      max: 4,
    },
    {
      kind: "number",
      key: "durationInFrames",
      label: "Duration (frames)",
      min: 4,
      max: 240,
    },
  ],
};
