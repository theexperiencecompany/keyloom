"use client";

import { loadImagePalette } from "@/lib/color-thief";

/**
 * Resolve an image-field value to a same-origin, canvas-safe URL for color
 * extraction:
 *   - uploads arrive as `data:`/`blob:` URLs — already safe, used as-is
 *   - external `http(s)` images are routed through the same-origin proxy so
 *     reading their pixels doesn't taint the canvas
 *   - static/public paths are already same-origin
 */
function extractionSrc(raw: string): string {
  if (/^(data:|blob:)/i.test(raw)) return raw;
  if (/^https?:/i.test(raw)) {
    try {
      if (
        typeof window !== "undefined" &&
        new URL(raw).origin === window.location.origin
      ) {
        return raw;
      }
    } catch {
      // malformed URL — fall through to the proxy
    }
    return `/api/proxy-image?url=${encodeURIComponent(raw)}`;
  }
  return raw.startsWith("/") ? raw : `/${raw}`;
}

/**
 * Darken a hex color toward black so a bright dominant still reads as a rich
 * backdrop behind white text (Spotify tints are noticeably muted, not the raw
 * cover color).
 */
function darken(hex: string, factor: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m?.[1]) return hex;
  const n = Number.parseInt(m[1], 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/**
 * Extract a background tint from an image URL (the dominant color, darkened a
 * touch), or null if extraction fails. Runs entirely in React — the resulting
 * color is then stored on the clip and passed to the composition as a prop.
 */
export async function extractTintColor(rawSrc: string): Promise<string | null> {
  const palette = await loadImagePalette(extractionSrc(rawSrc));
  if (!palette) return null;
  return darken(palette.dominant, 0.72);
}
