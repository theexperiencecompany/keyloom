/**
 * Shared export configuration. Two render backends are supported:
 *
 *  - "server": Remotion's headless Chrome renderer via `/api/render`. ~10–50×
 *    faster than the browser path; requires the Next.js server to be running
 *    (i.e. doesn't work in a static export). This is the default.
 *  - "browser": pure WebCodecs + html2canvas, runs entirely in the user's
 *    tab. Slower, but works in any deployed environment.
 *
 * `pipelineDepth` was removed — it was performance theater on the browser
 * path (html2canvas is single-threaded so concurrent rasterizes only fight
 * each other).
 */

export type RenderBackend = "server" | "browser";

export type ExportPreset = "fast" | "balanced" | "high";

export type ExportOptions = {
  renderer: RenderBackend;
  preset: ExportPreset;
  bitrate: number;
  /** Output resolution multiplier. Composition is always rendered at native
   *  size; this scales DOWN during rasterization/encoding. */
  scale: number;
  /** Browser path only — extra rAF wait per frame. */
  extraPaintWait: boolean;
  /** Force a keyframe every N frames; "auto" = once per second. */
  keyframeIntervalFrames: number | "auto";
};

export const EXPORT_PRESETS: Record<
  ExportPreset,
  Omit<ExportOptions, "renderer">
> = {
  fast: {
    preset: "fast",
    bitrate: 4_000_000,
    scale: 0.5,
    extraPaintWait: false,
    keyframeIntervalFrames: "auto",
  },
  balanced: {
    preset: "balanced",
    bitrate: 8_000_000,
    scale: 1,
    extraPaintWait: false,
    keyframeIntervalFrames: "auto",
  },
  high: {
    preset: "high",
    bitrate: 16_000_000,
    scale: 1,
    extraPaintWait: true,
    keyframeIntervalFrames: "auto",
  },
};

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  renderer: "server",
  ...EXPORT_PRESETS.balanced,
};

export function applyPreset(
  preset: ExportPreset,
  renderer: RenderBackend,
): ExportOptions {
  return { renderer, ...EXPORT_PRESETS[preset] };
}
