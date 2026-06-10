/**
 * Pure timing/layout helpers for TextMagicMove. Deliberately NOT a
 * `"use client"` module: `meta.ts` is evaluated on the server (the registry is
 * built server-side) and calls `computeMagicMoveDuration` at module load, so
 * this logic must stay free of any client-only boundary.
 *
 * All values are in DESIGN frames (60fps); the component's `useDesignFrame`
 * keeps them tied to wall-clock time at any export fps.
 */

export const MAGIC_ENTER = 22; // first phrase's entrance
export const MAGIC_HOLD = 56; // each phrase fully shown
export const MAGIC_MORPH = 28; // hand-off between two phrases
export const MAGIC_END_PAD = 24; // tail after the last phrase

/** Parse the newline-separated `phrases` prop into trimmed word arrays. */
export function parsePhrases(phrases: string): string[][] {
  const lines = phrases
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split(/\s+/).filter(Boolean));
  return lines.length ? lines : [["Magic", "move"]];
}

/** Total clip length for a phrase set, in design frames. */
export function computeMagicMoveDuration(phrases: string): number {
  const n = parsePhrases(phrases).length;
  return n * MAGIC_HOLD + Math.max(0, n - 1) * MAGIC_MORPH + MAGIC_END_PAD;
}
