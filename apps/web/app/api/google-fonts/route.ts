import { type NextRequest, NextResponse } from "next/server";

export type FontCategory =
  | "sans-serif"
  | "serif"
  | "display"
  | "handwriting"
  | "monospace";

export type FontInfo = {
  family: string;
  category: FontCategory;
  variants: string[];
  variable: boolean;
};

export type PaginatedFontsResponse = {
  items: FontInfo[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
};

const GOOGLE_FONTS_API_URL = "https://www.googleapis.com/webfonts/v1/webfonts";

// Static fallback used when no API key is configured. Top families that
// cover the vast majority of design styles. Sorted by popularity.
const FALLBACK_FONTS: FontInfo[] = [
  {
    family: "Inter",
    category: "sans-serif",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "Roboto",
    category: "sans-serif",
    variants: ["400", "700"],
    variable: false,
  },
  {
    family: "Open Sans",
    category: "sans-serif",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "Lato",
    category: "sans-serif",
    variants: ["400", "700"],
    variable: false,
  },
  {
    family: "Poppins",
    category: "sans-serif",
    variants: ["400", "700"],
    variable: false,
  },
  {
    family: "Montserrat",
    category: "sans-serif",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "Source Sans 3",
    category: "sans-serif",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "Nunito",
    category: "sans-serif",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "Work Sans",
    category: "sans-serif",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "DM Sans",
    category: "sans-serif",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "Manrope",
    category: "sans-serif",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "Plus Jakarta Sans",
    category: "sans-serif",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "Geist",
    category: "sans-serif",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "Outfit",
    category: "sans-serif",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "Space Grotesk",
    category: "sans-serif",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "Playfair Display",
    category: "serif",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "Merriweather",
    category: "serif",
    variants: ["400", "700"],
    variable: false,
  },
  {
    family: "Lora",
    category: "serif",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "EB Garamond",
    category: "serif",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "Source Serif 4",
    category: "serif",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "Crimson Pro",
    category: "serif",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "JetBrains Mono",
    category: "monospace",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "Fira Code",
    category: "monospace",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "IBM Plex Mono",
    category: "monospace",
    variants: ["400", "700"],
    variable: false,
  },
  {
    family: "Space Mono",
    category: "monospace",
    variants: ["400", "700"],
    variable: false,
  },
  {
    family: "Bebas Neue",
    category: "display",
    variants: ["400"],
    variable: false,
  },
  {
    family: "Anton",
    category: "sans-serif",
    variants: ["400"],
    variable: false,
  },
  {
    family: "Caveat",
    category: "handwriting",
    variants: ["400", "700"],
    variable: true,
  },
  {
    family: "Pacifico",
    category: "handwriting",
    variants: ["400"],
    variable: false,
  },
  {
    family: "Dancing Script",
    category: "handwriting",
    variants: ["400", "700"],
    variable: true,
  },
];

let cachedFonts: FontInfo[] | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 1 day

async function loadAllFonts(): Promise<FontInfo[]> {
  if (cachedFonts && Date.now() < cacheExpiresAt) return cachedFonts;

  const apiKey = process.env.GOOGLE_FONTS_API_KEY;
  if (!apiKey) {
    cachedFonts = FALLBACK_FONTS;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return FALLBACK_FONTS;
  }

  try {
    const res = await fetch(
      `${GOOGLE_FONTS_API_URL}?key=${apiKey}&sort=popularity`,
    );
    if (!res.ok) throw new Error(`Google Fonts API ${res.status}`);
    const data = (await res.json()) as {
      items: Array<{
        family: string;
        category: FontCategory;
        variants: string[];
      }>;
    };
    const fonts: FontInfo[] = data.items.map((f) => ({
      family: f.family,
      category: f.category,
      variants: f.variants,
      variable: f.variants.some(
        (v) => v.includes("wght") || v.includes("ital,wght"),
      ),
    }));
    cachedFonts = fonts;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return fonts;
  } catch (err) {
    console.warn("[google-fonts] live fetch failed, using fallback:", err);
    cachedFonts = FALLBACK_FONTS;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return FALLBACK_FONTS;
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const category = (url.searchParams.get("category") ?? "all") as
    | FontCategory
    | "all";
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20),
  );
  const offset = Math.max(
    0,
    parseInt(url.searchParams.get("offset") ?? "0", 10) || 0,
  );

  const all = await loadAllFonts();

  let filtered = all;
  if (category !== "all") {
    filtered = filtered.filter((f) => f.category === category);
  }
  if (q) {
    filtered = filtered.filter((f) => f.family.toLowerCase().includes(q));
  }

  const items = filtered.slice(offset, offset + limit);
  const total = filtered.length;

  const body: PaginatedFontsResponse = {
    items,
    total,
    offset,
    limit,
    hasMore: offset + items.length < total,
  };
  return NextResponse.json(body);
}
