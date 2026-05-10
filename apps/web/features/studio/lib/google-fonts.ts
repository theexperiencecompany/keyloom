import type {
  FontInfo,
  PaginatedFontsResponse,
} from "@/app/api/google-fonts/route";

export type { FontInfo, PaginatedFontsResponse };

export function buildFontCssUrl(
  family: string,
  weights: string[] = ["400", "700"],
): string {
  const encodedFamily = encodeURIComponent(family).replace(/%20/g, "+");
  const weightsParam = weights.join(";");
  return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weightsParam}&display=swap`;
}

const loadedFonts = new Set<string>();

/**
 * Inject a stylesheet `<link>` for a Google Font family into the current
 * document. Idempotent — calling twice for the same family is a no-op.
 */
export function loadGoogleFont(family: string, weights?: string[]): void {
  if (typeof document === "undefined") return;
  const trimmed = family.trim();
  if (!trimmed) return;
  const key = `${trimmed}:${(weights ?? ["400", "700"]).join(",")}`;
  if (loadedFonts.has(key)) return;
  loadedFonts.add(key);

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = buildFontCssUrl(trimmed, weights);
  document.head.appendChild(link);
}

/**
 * Wraps a font family name in quotes and appends a generic-family fallback
 * appropriate for the category, so the resulting `font-family` CSS value
 * degrades gracefully if the network never delivers the Google Font.
 */
export function toFontFamilyValue(
  family: string,
  category?: FontInfo["category"],
): string {
  const fallback = (() => {
    switch (category) {
      case "serif":
        return "Georgia, 'Times New Roman', serif";
      case "monospace":
        return "ui-monospace, SFMono-Regular, Menlo, monospace";
      case "handwriting":
      case "display":
        return "system-ui, sans-serif";
      default:
        return "system-ui, sans-serif";
    }
  })();
  return `"${family}", ${fallback}`;
}

/**
 * Best-effort: extract the first family name from a CSS `font-family` value
 * so we can re-load it via Google Fonts.
 */
export function extractPrimaryFamily(fontFamily: string): string | null {
  const first = fontFamily.split(",")[0];
  if (!first) return null;
  return first.replace(/['"]/g, "").trim() || null;
}
