"use client";

import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";

/**
 * Makes a fixed-design composition responsive to the project canvas.
 *
 * Compositions are authored at a fixed `designWidth × designHeight` with
 * hardcoded pixel sizes. When the canvas format changes (16:9 → 9:16, etc.)
 * that content would otherwise overflow and get cropped, or — if you naively
 * scale the whole thing — letterbox with black bars.
 *
 * `FitContent` splits the two concerns:
 *   - `background` fills the WHOLE canvas (any aspect) → no black bars.
 *   - the children are rendered at their native design size and scaled to FIT
 *     the canvas, centered → content stays fully visible, never cropped, and
 *     re-centers as the canvas reshapes.
 *
 * Usage: replace the composition's root `<AbsoluteFill background …>` with
 * `<FitContent background designWidth designHeight>` and put the content layer
 * (flex centering, color, font, the actual elements) inside — without its own
 * background.
 *
 * The inner box is `position: relative`, so a child `<AbsoluteFill>` fills the
 * design-sized box (not the canvas). Downscaling via `transform: scale` stays
 * crisp in `@remotion/web-renderer` export.
 */
export function FitContent({
  designWidth,
  designHeight,
  background,
  children,
  contentStyle,
}: {
  designWidth: number;
  designHeight: number;
  background?: string;
  children: ReactNode;
  /** Extra styles for the scaled design box (rare; e.g. fontFamily). */
  contentStyle?: CSSProperties;
}) {
  const { width, height } = useVideoConfig();
  const scale = Math.min(width / designWidth, height / designHeight);

  return (
    <AbsoluteFill
      style={{
        background,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: designWidth,
          height: designHeight,
          position: "relative",
          flexShrink: 0,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
}
