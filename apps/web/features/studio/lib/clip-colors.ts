export const PX_PER_SECOND = 80;

export type ClipPalette = {
  /** Tailwind classes for the vertical body gradient (`bg-gradient-to-b`). */
  className: string;
  /** Hex of the "from" (top / lighter) gradient stop. */
  fromHex: string;
  /** Hex of the "to" (bottom / darker) gradient stop. */
  toHex: string;
};

export const CLIP_PALETTES: ClipPalette[] = [
  {
    className: "from-violet-400 to-violet-600",
    fromHex: "#a78bfa",
    toHex: "#7c3aed",
  },
  {
    className: "from-sky-400 to-sky-600",
    fromHex: "#38bdf8",
    toHex: "#0284c7",
  },
  {
    className: "from-emerald-400 to-emerald-600",
    fromHex: "#34d399",
    toHex: "#059669",
  },
  {
    className: "from-amber-400 to-amber-600",
    fromHex: "#fbbf24",
    toHex: "#d97706",
  },
  {
    className: "from-rose-400 to-rose-600",
    fromHex: "#fb7185",
    toHex: "#e11d48",
  },
  {
    className: "from-fuchsia-400 to-fuchsia-600",
    fromHex: "#e879f9",
    toHex: "#c026d3",
  },
];

export function paletteForCompositionId(id: string): ClipPalette {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return CLIP_PALETTES[Math.abs(hash) % CLIP_PALETTES.length]!;
}

export function colorForCompositionId(id: string): string {
  return paletteForCompositionId(id).className;
}
