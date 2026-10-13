// Real SF Pro (Apple's SF-Pro.dmg from developer.apple.com/fonts), subset to
// Latin + punctuation + arrows/currency/math and shipped as woff2 in
// public/fonts. Loaded once, deterministically: every render blocks on a
// delayRender handle until all faces are in document.fonts.
import type React from "react";
import { continueRender, delayRender } from "remotion";
import { threadAsset } from "./asset";

export const SF_TEXT =
  '"SF Pro Text", "SF Pro Display", -apple-system, system-ui, sans-serif';
export const SF_DISPLAY =
  '"SF Pro Display", "SF Pro Text", -apple-system, system-ui, sans-serif';

const WEIGHTS = [
  ["Regular", 400],
  ["Medium", 500],
  ["Semibold", 600],
  ["Bold", 700],
] as const;

let loaded: Promise<void> | null = null;

export function loadSFPro(): Promise<void> {
  if (loaded) return loaded;
  if (typeof document === "undefined") return Promise.resolve();
  const handle = delayRender("Loading SF Pro");
  const faces: FontFace[] = [];
  for (const family of ["Text", "Display"] as const) {
    for (const [name, weight] of WEIGHTS) {
      faces.push(
        new FontFace(
          `SF Pro ${family}`,
          `url(${threadAsset(`fonts/SF-Pro-${family}-${name}.woff2`)}) format("woff2")`,
          {
            weight: String(weight),
            style: "normal",
            display: "block",
          },
        ),
      );
    }
  }
  loaded = Promise.all(
    faces.map((f) =>
      f.load().then((ff) => {
        document.fonts.add(ff);
      }),
    ),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error("SF Pro failed to load", err);
      continueRender(handle);
      throw err;
    });
  return loaded;
}

/** Apple HIG SF Pro tracking (1/1000 em) for iOS, by point size. */
const TRACKING: Record<number, number> = {
  6: 41,
  7: 34,
  8: 26,
  9: 19,
  10: 12,
  11: 6,
  12: 0,
  13: -6,
  14: -11,
  15: -16,
  16: -20,
  17: -26,
  18: -25,
  19: -24,
  20: -23,
  21: -18,
  22: -12,
  23: -4,
  24: 3,
  25: 6,
  26: 8,
  27: 11,
  28: 14,
  29: 14,
  30: 14,
  31: 13,
  32: 13,
  33: 12,
  34: 12,
  36: 10,
  40: 10,
  44: 8,
  48: 8,
  56: 6,
  64: 4,
  72: 2,
  80: 0,
};

/** letter-spacing in em for a given point size (nearest HIG row). */
export function tracking(size: number): string {
  const [, value] = Object.entries(TRACKING).reduce((best, row) =>
    Math.abs(+row[0] - size) < Math.abs(+best[0] - size) ? row : best,
  );
  return `${value / 1000}em`;
}

/**
 * iOS system-font style: SF Pro Text below 20pt, SF Pro Display from 20pt up
 * (the optical-size switch the system font does), plus the HIG tracking.
 */
export function sf(
  size: number,
  weight: 400 | 500 | 600 | 700 = 400,
): React.CSSProperties {
  return {
    fontFamily: size >= 20 ? SF_DISPLAY : SF_TEXT,
    fontSize: size,
    fontWeight: weight,
    letterSpacing: tracking(size),
  };
}
