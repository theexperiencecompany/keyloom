import {
  type ClipStyle,
  type ClipStyleDefaults,
  resolveClipStyle,
} from "../clip-style";

export { snap, snapNear, snapZero } from "../snap";

/**
 * Shared prop shape used by every Title* and Text* composition. The
 * universal Style controls (background / text color / font / accent) live
 * on `clipStyle`; per-clip text content lives on `headline` and `subtitle`.
 */
export type TitleProps = {
  headline: string;
  subtitle: string;
  clipStyle?: ClipStyle;
};

export const TITLE_FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif";

export const TITLE_DEFAULTS: ClipStyleDefaults = {
  background: "#ffffff",
  color: "#0f1014",
  fontFamily: TITLE_FONT_FAMILY,
  accent: "#0f1014",
};

export function resolveTitleStyle(clipStyle: ClipStyle | undefined) {
  return resolveClipStyle(clipStyle, TITLE_DEFAULTS);
}

export function isDarkColor(color: string): boolean {
  const c = color.trim().toLowerCase();
  if (c === "white" || c === "#fff" || c === "#ffffff") return true;
  if (c.startsWith("#") && c.length === 7) {
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6;
  }
  return false;
}

export function getSubtitleColor(textColor: string): string {
  return isDarkColor(textColor)
    ? "rgba(15,16,20,0.55)"
    : "rgba(255,255,255,0.65)";
}

/**
 * Field set for every Title* / Text* composition. Note: NO color or font
 * fields here — those are handled universally via the Studio's Style
 * section (see `clip-style.ts`).
 */
export const TITLE_FIELDS = [
  { kind: "textarea" as const, key: "headline", label: "Headline", rows: 2 },
  {
    kind: "textarea" as const,
    key: "subtitle",
    label: "Subtitle (optional)",
    rows: 2,
  },
];
