import { useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Returns the current frame **as if the composition were running at 60fps**,
 * regardless of the actual render fps. Use this in place of
 * `useCurrentFrame()` so a composition's hardcoded timing constants
 * (`const HEADLINE_START = 8`, etc.) stay tied to wall-clock time when the
 * project is exported at a higher fps for ProMotion smoothness.
 *
 * Math: a composition rendered at 120fps with all clip durations doubled
 * still spans the same wall-clock seconds, but `useCurrentFrame()` would
 * tick from 0 to 199 instead of 0 to 99. This hook divides the real frame
 * by `fps / DESIGN_FPS`, so at 120fps render → `useDesignFrame()` returns
 * 0, 0.5, 1, 1.5, ..., 99.5 — sampling the same animation at finer
 * temporal granularity without changing its timing.
 *
 * `interpolate()` accepts non-integer frame values, so this is a drop-in
 * replacement: compositions don't need to round or branch on fps.
 *
 * The "design fps" is fixed at 60 because every existing composition's
 * timing constants were authored for 60fps. If a composition is authored
 * for a different fps, pass it explicitly: `useDesignFrame(30)`.
 */
export const DESIGN_FPS = 60;

export function useDesignFrame(designFps: number = DESIGN_FPS): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (fps === designFps) return frame;
  return (frame * designFps) / fps;
}
