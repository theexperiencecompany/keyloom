import { type BrowserSource, getColorSync, getPaletteSync } from "colorthief";

/**
 * Dominant color + representative palette extracted from an image, as hex
 * strings ready to drop into CSS or pass to a Remotion composition as props.
 */
export type ImagePalette = {
  /** Most dominant color, e.g. "#1e2a78". */
  dominant: string;
  /** Up to `colorCount` colors, most → least dominant. Includes `dominant`. */
  palette: string[];
};

/**
 * Where this lives and why:
 *
 * Color extraction is a one-time, React-side concern. The studio computes a
 * color HERE (when the user picks an image) and passes the resulting hex into a
 * Remotion composition as a plain prop. The composition stays a pure function
 * of its props — it never runs color-thief at render time, so there's no canvas
 * work, no `delayRender`, and identical output in the studio, Lambda, and the
 * in-browser exporter.
 */

/**
 * Extract a palette from an ALREADY-LOADED image source (an `<img>`, canvas,
 * `ImageBitmap`, …). Synchronous, pure-JS (color-thief's browser quantizer, no
 * WASM/network). Returns null if extraction fails — most often a tainted canvas
 * from a cross-origin image loaded without CORS.
 */
export function paletteFromSource(
  source: BrowserSource,
  colorCount = 6,
): ImagePalette | null {
  try {
    const dom = getColorSync(source, { colorCount });
    if (!dom) return null;
    const pal = getPaletteSync(source, { colorCount });
    return {
      dominant: dom.hex(),
      palette: (pal && pal.length > 0 ? pal : [dom]).map((c) => c.hex()),
    };
  } catch {
    return null;
  }
}

/**
 * Load an image URL and extract its palette. Resolves to null on an empty src,
 * a load error, or outside the browser.
 *
 * The image is loaded with `crossOrigin="anonymous"` so the canvas stays
 * untainted — serve cross-origin images same-origin (proxied) first.
 */
export function loadImagePalette(
  src: string,
  colorCount = 6,
): Promise<ImagePalette | null> {
  return new Promise((resolve) => {
    if (!src || typeof document === "undefined") {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(paletteFromSource(img, colorCount));
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
