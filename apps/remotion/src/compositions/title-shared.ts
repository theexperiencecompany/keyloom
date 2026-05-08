export type TitleProps = {
  headline: string;
  subtitle: string;
  backgroundColor: string;
  textColor: string;
};

export const TITLE_FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif";

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

export const TITLE_FIELDS = [
  { kind: "textarea" as const, key: "headline", label: "Headline", rows: 2 },
  {
    kind: "textarea" as const,
    key: "subtitle",
    label: "Subtitle (optional)",
    rows: 2,
  },
  { kind: "color" as const, key: "backgroundColor", label: "Background color" },
  { kind: "color" as const, key: "textColor", label: "Text color" },
];
