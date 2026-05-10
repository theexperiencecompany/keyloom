"use client";

import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { useClipDurationInFrames } from "./clip-context";
import type { EffectInfo } from "./schema";

export type KenBurnsProps = {
  fromScale: number;
  toScale: number;
  panX: number;
  panY: number;
  children?: React.ReactNode;
};

export function KenBurns({
  fromScale,
  toScale,
  panX,
  panY,
  children,
}: KenBurnsProps) {
  const frame = useCurrentFrame();
  const duration = Math.max(1, useClipDurationInFrames());

  // Smooth ease-in-out so the camera drift starts and ends gently.
  const easeOpts = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  };
  const scale = interpolate(
    frame,
    [0, duration - 1],
    [fromScale, toScale],
    easeOpts,
  );
  const tx = interpolate(frame, [0, duration - 1], [0, panX], easeOpts);
  const ty = interpolate(frame, [0, duration - 1], [0, panY], easeOpts);

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
        transformOrigin: "center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

export const kenBurnsInfo: EffectInfo<{
  fromScale: number;
  toScale: number;
  panX: number;
  panY: number;
}> = {
  id: "KenBurns",
  title: "Ken Burns",
  description: "Slow scale + pan over the clip duration",
  trigger: "range",
  defaultProps: {
    fromScale: 1,
    toScale: 1.15,
    panX: 0,
    panY: 0,
  },
  fields: [
    {
      kind: "number",
      key: "fromScale",
      label: "From scale",
      min: 0.5,
      max: 3,
    },
    { kind: "number", key: "toScale", label: "To scale", min: 0.5, max: 3 },
    { kind: "number", key: "panX", label: "Pan X (px)", min: -400, max: 400 },
    { kind: "number", key: "panY", label: "Pan Y (px)", min: -400, max: 400 },
  ],
};
