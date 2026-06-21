export const PX_PER_SECOND = 80;

/**
 * A clip's timeline coloring. Deliberately FLAT — a calm tinted surface, a
 * subtle same-hue border, and one solid accent used for the left rail and the
 * selection ring. No gradients, no glossy highlights: the block should read as
 * a quiet labelled card, not a candy button.
 */
export type ClipPalette = {
  /** Solid hue — left accent rail, selection ring, dots. */
  accent: string;
  /** Flat block fill (the accent mixed a little into the panel surface). */
  surface: string;
  /** Slightly stronger fill for hover. */
  surfaceHover: string;
  /** Low-contrast same-hue border. */
  border: string;
};

// Muted 400-level hues — enough chroma to distinguish scenes, not so much they
// shout. Order is arbitrary; clips hash into it.
const ACCENTS = [
  "#6366f1", // indigo
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#a855f7", // purple
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
  ];
}

function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Surfaces are the accent at low alpha — translucent, so the block tints
// whatever timeline background is behind it. That keeps it readable in BOTH
// light and dark themes (no hardcoded dark fill). Text uses the theme-aware
// `foreground` token in the component.
export const CLIP_PALETTES: ClipPalette[] = ACCENTS.map((accent) => ({
  accent,
  surface: rgba(accent, 0.16),
  surfaceHover: rgba(accent, 0.28),
  border: rgba(accent, 0.45),
}));

export function paletteForCompositionId(id: string): ClipPalette {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return CLIP_PALETTES[Math.abs(hash) % CLIP_PALETTES.length]!;
}
