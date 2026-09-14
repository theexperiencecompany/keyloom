/** Linear interpolation between `a` and `b` by `t` (unclamped). */
export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

/** Clamp a number into the [0, 1] range. */
export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
