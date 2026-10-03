import { interpolate } from "remotion";
import { APPLE_EASE } from "../lib/easing";

export const CHART_PALETTE = [
  "#00bbff",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#3b82f6",
  "#ec4899",
  "#84cc16",
];

export function chartReveal(frame: number, start: number, duration: number) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: APPLE_EASE,
  });
}

export function parseSeriesString(input: string): number[] {
  return input
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((t) => Number(t))
    .filter((n) => Number.isFinite(n));
}

export function parseLabels(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const norm = value / pow;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return nice * pow;
}

export const GRID_FRACTIONS = [0.25, 0.5, 0.75, 1];
export const TICK_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];

export function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const cp1x = prev.x + (curr.x - prev.x) / 3;
    const cp2x = prev.x + ((curr.x - prev.x) * 2) / 3;
    d += ` C ${cp1x} ${prev.y}, ${cp2x} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}
