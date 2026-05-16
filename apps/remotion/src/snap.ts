/**
 * Numerical helpers for keeping headless-render output deterministic.
 *
 * Remotion's headless renderer (CLI + `@remotion/web-renderer`) rasterizes
 * each frame independently from a fresh page state. CSS properties that
 * trigger compositor layers (filter, will-change) get layer positions
 * computed with float math that can produce 1px alternating offsets when
 * the input values fluctuate by float noise between "identical" frames —
 * visible as a thin glyph-edge wobble in exports.
 *
 * Root causes:
 *   1. Bezier easing returns 0.99999998 at the clamp endpoint rather than
 *      exactly 1.0. Downstream `(1 - progress) * N` becomes ~2e-6 instead
 *      of 0, producing a slightly different CSS string every frame.
 *   2. Sub-pixel `transform: translateY(2.34px)` for text in headless
 *      Chromium gets rasterized to the same integer-pixel row regardless;
 *      sub-pixel translate is visually equivalent to its rounded value
 *      for un-composited text.
 *
 * `snap(value)`
 *   Identity. Kept as a function so the existing 50+ call sites stay
 *   readable, but rounding to integer pixels is the wrong move now:
 *   animated text uses `transform: translate3d(0, y, 0)` +
 *   `willChange: "transform"`, putting each animating element on its
 *   own GPU compositor layer. The compositor positions the layer at
 *   sub-pixel coordinates via bilinear interpolation, so a sub-pixel
 *   `y` value produces visibly smoother motion (no more 1px stair-step
 *   during upward translation). If `snap()` rounded to integer, the
 *   compositor would just snap the layer to the same integer row and
 *   you'd get the stair-step back. So: pass values through untouched.
 *
 * `snapZero(value, epsilon=1e-3)`
 *   Round near-zero values to exactly 0. Apply to `filter: blur(${x}px)`
 *   and similar properties that allocate compositor buffers — keeps the
 *   CSS string identical when an easing has clamped and the property
 *   should be at its rest value.
 */
export function snap(value: number): number {
  // Round bezier-clamp float noise (~1e-7) to exactly 0 so a translate
  // that's "mathematically at rest" produces an identical CSS string every
  // frame. Without this, `(1 - progress) * N` evaluates to ~3e-6 at the
  // animation end, the compositor positions the layer at that sub-pixel
  // y, and adjacent frames jitter by ~1px (visible as the text
  // "breathing" up and down at rest). Anything above 1e-3 passes through
  // unchanged so motion stays sub-pixel smooth.
  return Math.abs(value) < 1e-3 ? 0 : value;
}

export function snapZero(value: number, epsilon = 1e-3): number {
  return Math.abs(value) < epsilon ? 0 : value;
}

/**
 * Round a value to `target` when it's within `epsilon` of it. Use on
 * `scale()` interpolations that should end at exactly 1 (or any clean
 * landmark) but suffer from bezier easing returning 0.99999998 at the
 * clamp endpoint:
 *
 *   const scale = snapNear(0.96 + headlineProgress * 0.04, 1);
 *
 * Without this wrapper, `scale` settles at 0.99999999 instead of 1,
 * causing Chromium to allocate a fresh compositor layer every frame
 * and producing 1px alternating sub-pixel jitter in the export.
 */
export function snapNear(
  value: number,
  target: number,
  epsilon = 1e-3,
): number {
  return Math.abs(value - target) < epsilon ? target : value;
}
