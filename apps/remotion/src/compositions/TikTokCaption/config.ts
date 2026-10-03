// Shared configuration for TikTokCaption: aspect ratios, alignment knobs,
// and the curated display-font picker. Lives in the composition folder so
// both the studio inspector / shorts page and the rendered composition can
// import without crossing package boundaries.

export const ASPECT_DIMENSIONS = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
} as const;

export type AspectRatio = keyof typeof ASPECT_DIMENSIONS;

export type VAlign = "top" | "center" | "bottom";
export type HAlign = "left" | "center" | "right";

/** Free caption placement as fractions of composition size (box center). */
export type CaptionPos = { x: number; y: number };

export type FontKey =
  | "anton"
  | "bebas"
  | "archivoBlack"
  | "poppins"
  | "montserrat"
  | "lilitaOne"
  | "inter"
  | "playfair"
  | "courierPrime"
  | "permanentMarker";

export const FONTS: Record<
  FontKey,
  {
    label: string;
    family: string;
    fallback: string;
    weight: number;
    cssFamily: string;
  }
> = {
  anton: {
    label: "Anton",
    family: "Anton",
    fallback: "Impact, sans-serif",
    weight: 400,
    cssFamily: "'Anton', Impact, sans-serif",
  },
  bebas: {
    label: "Bebas Neue",
    family: "Bebas Neue",
    fallback: "Impact, sans-serif",
    weight: 400,
    cssFamily: "'Bebas Neue', Impact, sans-serif",
  },
  archivoBlack: {
    label: "Archivo Black",
    family: "Archivo Black",
    fallback: "Impact, sans-serif",
    weight: 400,
    cssFamily: "'Archivo Black', Impact, sans-serif",
  },
  poppins: {
    label: "Poppins",
    family: "Poppins",
    fallback: "Inter, sans-serif",
    weight: 900,
    cssFamily: "'Poppins', Inter, sans-serif",
  },
  montserrat: {
    label: "Montserrat",
    family: "Montserrat",
    fallback: "Arial, sans-serif",
    weight: 900,
    cssFamily: "'Montserrat', Arial, sans-serif",
  },
  lilitaOne: {
    label: "Lilita One",
    family: "Lilita One",
    fallback: "Impact, sans-serif",
    weight: 400,
    cssFamily: "'Lilita One', Impact, sans-serif",
  },
  inter: {
    label: "Inter",
    family: "Inter",
    fallback: "system-ui, sans-serif",
    weight: 700,
    cssFamily: "'Inter', system-ui, sans-serif",
  },
  playfair: {
    label: "Playfair Display",
    family: "Playfair Display",
    fallback: "Georgia, serif",
    weight: 700,
    cssFamily: "'Playfair Display', Georgia, serif",
  },
  courierPrime: {
    label: "Courier Prime",
    family: "Courier Prime",
    fallback: "'Courier New', monospace",
    weight: 700,
    cssFamily: "'Courier Prime', 'Courier New', monospace",
  },
  permanentMarker: {
    label: "Permanent Marker",
    family: "Permanent Marker",
    fallback: "'Comic Sans MS', cursive",
    weight: 400,
    cssFamily: "'Permanent Marker', 'Comic Sans MS', cursive",
  },
};

export const FONT_KEYS: FontKey[] = [
  "anton",
  "bebas",
  "archivoBlack",
  "poppins",
  "montserrat",
  "lilitaOne",
  "inter",
  "playfair",
  "courierPrime",
  "permanentMarker",
];
export const DEFAULT_FONT_KEY: FontKey = "anton";

// Family-string → FontKey lookup, used by the composition to derive the
// weight (Poppins needs 900, the others render at their loaded weight).
export function fontKeyFromFamily(family: string | undefined): FontKey {
  if (!family) return DEFAULT_FONT_KEY;
  const f = family.toLowerCase();
  if (f.includes("bebas")) return "bebas";
  if (f.includes("archivo")) return "archivoBlack";
  if (f.includes("poppins")) return "poppins";
  if (f.includes("montserrat")) return "montserrat";
  if (f.includes("lilita")) return "lilitaOne";
  if (f.includes("playfair")) return "playfair";
  if (f.includes("courier")) return "courierPrime";
  if (f.includes("marker")) return "permanentMarker";
  if (f.includes("inter")) return "inter";
  if (f.includes("anton")) return "anton";
  return DEFAULT_FONT_KEY;
}
