"use client";

import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { useClipDurationInFrames } from "./clip-context";
import type { EffectInfo } from "./schema";

export type SlideOutProps = {
  direction: "up" | "down" | "left" | "right";
  distance: number;
  durationInFrames: number;
  children?: React.ReactNode;
};

export function SlideOut({
  direction,
  distance,
  durationInFrames,
  children,
}: SlideOutProps) {
  const frame = useCurrentFrame();
  const total = useClipDurationInFrames();
  const start = Math.max(0, total - durationInFrames);

  // Cubic ease-in: content sits for a beat, then accelerates off screen.
  const t = interpolate(frame, [start, total - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.55, 0, 1, 0.45),
  });

  const sign = direction === "up" || direction === "left" ? -1 : 1;
  const isHorizontal = direction === "left" || direction === "right";
  const tx = isHorizontal ? sign * distance * t : 0;
  const ty = !isHorizontal ? sign * distance * t : 0;

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${tx}px, ${ty}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

export const slideOutInfo: EffectInfo<{
  direction: "up" | "down" | "left" | "right";
  distance: number;
  durationInFrames: number;
}> = {
  id: "SlideOut",
  title: "Slide out",
  description: "Slide off-screen at the end of the clip",
  trigger: "exit",
  defaultProps: {
    direction: "up",
    distance: 240,
    durationInFrames: 24,
  },
  fields: [
    {
      kind: "select",
      key: "direction",
      label: "Direction",
      options: [
        { value: "up", label: "Up" },
        { value: "down", label: "Down" },
        { value: "left", label: "Left" },
        { value: "right", label: "Right" },
      ],
    },
    {
      kind: "number",
      key: "distance",
      label: "Distance (px)",
      min: 0,
      max: 2000,
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
