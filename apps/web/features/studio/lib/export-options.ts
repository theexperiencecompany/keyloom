/**
 * Client-side export configuration. Single render path — Remotion's
 * `@remotion/web-renderer` runs everything in the user's browser. The three
 * presets trade off encoding speed vs. output quality.
 */

export type ExportPreset = "fast" | "balanced" | "high";

export type ExportOptions = {
  preset: ExportPreset;
  /** H.264 target bitrate in bits/sec. */
  bitrate: number;
  /** Output resolution multiplier. <1 renders smaller (faster). */
  scale: number;
};

export const EXPORT_PRESETS: Record<ExportPreset, ExportOptions> = {
  fast: {
    preset: "fast",
    bitrate: 4_000_000,
    scale: 0.5,
  },
  balanced: {
    preset: "balanced",
    bitrate: 8_000_000,
    scale: 1,
  },
  high: {
    preset: "high",
    bitrate: 16_000_000,
    scale: 1,
  },
};

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = EXPORT_PRESETS.balanced;

export function applyPreset(preset: ExportPreset): ExportOptions {
  return { ...EXPORT_PRESETS[preset] };
}
