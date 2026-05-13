/**
 * Snap an animated translate value to the nearest integer pixel ONLY when
 * rendering (CLI `renderMedia` or `@remotion/web-renderer` browser export).
 * In the live `<Player>` preview it returns the raw value so motion stays
 * smooth via the GPU compositor.
 *
 * Why: headless rendering rasterizes each frame independently with no layer
 * reuse, so sub-pixel `transform: translateY(2.34px)` lands glyphs on a
 * different sub-pixel grid every frame → visible wobble in exports.
 *
 * Detection: we look at `window.remotion_puppeteerTimeout`, which both the
 * CLI puppeteer-driven renderer and `@remotion/web-renderer` set before
 * mounting the React tree. We can NOT use `getRemotionEnvironment()` because
 * its `isRendering` flag also requires `process.env.NODE_ENV === "production"`,
 * which excludes the common case of exporting from a `next dev` browser tab.
 */
export function snap(value: number): number {
  if (typeof window === "undefined") return Math.round(value);
  if (
    typeof (window as { remotion_puppeteerTimeout?: unknown })
      .remotion_puppeteerTimeout !== "undefined"
  ) {
    return Math.round(value);
  }
  return value;
}
