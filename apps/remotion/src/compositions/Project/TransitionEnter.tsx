"use client";
import type { ReactNode } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { SceneTransition } from "../../transitions";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

type Props = {
  transition: SceneTransition;
  clipDurationInFrames: number;
  children: ReactNode;
};

/**
 * Wraps a clip's inner content with an ENTER transition. The first
 * `transition.durationInFrames` frames of the clip play the transition; the
 * rest of the clip plays untouched.
 */
export function TransitionEnter({
  transition,
  clipDurationInFrames,
  children,
}: Props) {
  const frame = useCurrentFrame();
  const duration = Math.min(
    Math.max(1, transition.durationInFrames),
    Math.max(1, clipDurationInFrames),
  );

  if (transition.kind === "none" || frame >= duration) {
    return <>{children}</>;
  }

  const t = interpolate(frame, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  const { opacity, transform, clipPath } = transitionStyle(transition.kind, t);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        transform,
        clipPath,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
  );
}

function transitionStyle(
  kind: SceneTransition["kind"],
  t: number,
): { opacity: number; transform: string; clipPath: string | undefined } {
  switch (kind) {
    case "fade":
      return { opacity: t, transform: "none", clipPath: undefined };
    case "swipe-left":
      return {
        opacity: 1,
        transform: `translateX(${(1 - t) * 100}%)`,
        clipPath: undefined,
      };
    case "swipe-right":
      return {
        opacity: 1,
        transform: `translateX(${-(1 - t) * 100}%)`,
        clipPath: undefined,
      };
    case "swipe-up":
      return {
        opacity: 1,
        transform: `translateY(${(1 - t) * 100}%)`,
        clipPath: undefined,
      };
    case "swipe-down":
      return {
        opacity: 1,
        transform: `translateY(${-(1 - t) * 100}%)`,
        clipPath: undefined,
      };
    case "zoom-in":
      return {
        opacity: t,
        transform: `scale(${0.85 + t * 0.15})`,
        clipPath: undefined,
      };
    case "zoom-out":
      return {
        opacity: t,
        transform: `scale(${1.18 - t * 0.18})`,
        clipPath: undefined,
      };
    case "none":
    default:
      return { opacity: 1, transform: "none", clipPath: undefined };
  }
}
