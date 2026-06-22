"use client";
import { useVideoConfig } from "remotion";

/**
 * Responsive layout primitive for compositions that should *reflow* to any
 * canvas (16:9 / 9:16 / 1:1 / 4:5) instead of being authored at a fixed size
 * and uniformly scaled (the `FitContent` model, which only shrinks).
 *
 * Size things RELATIVE to the canvas — `vmin(6)` for a font, `vw(80)` for a
 * width — and branch on `orientation` where the layout genuinely differs.
 * Think of it as CSS viewport units (`vw`/`vh`/`vmin`/`vmax`) for the Remotion
 * canvas.
 */
export type Orientation = "portrait" | "landscape" | "square";

export type CanvasLayout = {
  width: number;
  height: number;
  orientation: Orientation;
  isPortrait: boolean;
  isLandscape: boolean;
  /** % of canvas width. */
  vw: (pct: number) => number;
  /** % of canvas height. */
  vh: (pct: number) => number;
  /** % of the smaller side — stable element sizing across orientations. */
  vmin: (pct: number) => number;
  /** % of the larger side. */
  vmax: (pct: number) => number;
};

export function useCanvasLayout(): CanvasLayout {
  const { width, height } = useVideoConfig();
  const ratio = width / height;
  const orientation: Orientation =
    Math.abs(ratio - 1) < 0.05
      ? "square"
      : ratio > 1
        ? "landscape"
        : "portrait";
  const minDim = Math.min(width, height);
  const maxDim = Math.max(width, height);
  return {
    width,
    height,
    orientation,
    isPortrait: orientation === "portrait",
    isLandscape: orientation === "landscape",
    vw: (pct) => (width * pct) / 100,
    vh: (pct) => (height * pct) / 100,
    vmin: (pct) => (minDim * pct) / 100,
    vmax: (pct) => (maxDim * pct) / 100,
  };
}
