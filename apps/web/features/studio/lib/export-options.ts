/**
 * Client-side export configuration. Single render path — Remotion's
 * `@remotion/web-renderer` runs everything in the user's browser. The three
 * presets trade off encoding speed vs. output quality.
 */

export type ExportPreset = "fast" | "balanced" | "high";

/**
 * Supported export frame rates. 60 is the design-time fps every composition
 * is authored against; 120 doubles temporal sampling for ProMotion-class
 * displays so animations look as smooth as native UI. Compositions stay
 * fps-agnostic via `useDesignFrame()` — they always behave as if running at
 * 60fps regardless of which fps the user picks here.
 */
export type ExportFps = 30 | 60 | 120;

export type ExportOptions = {
  preset: ExportPreset;
  /** H.264 target bitrate in bits/sec. */
  bitrate: number;
  /** Output resolution multiplier. <1 renders smaller (faster). */
  scale: number;
  /**
   * Distance between H.264 keyframes (in seconds). Lower = more keyframes =
   * less inter-frame prediction shimmer on at-rest text. Setting this to
   * the per-frame duration (1/fps) forces every frame to be a keyframe
   * (all-intra), which eliminates encoder shimmer entirely at the cost of
   * a ~10× larger file. We default to a tight 0.5s for the user-facing
   * "high" preset and 1.0s for "balanced" — both noticeably reduce the
   * "ever so slight" shimmer that h264's default keyframe interval
   * (~2-10s) produces on static text.
   */
  keyframeIntervalSec: number;
  /**
   * Output frame rate. 120fps is recommended for ProMotion displays — it
   * roughly doubles render time but eliminates the perceptual judder of
   * 60fps content displayed on a 120Hz panel. 30fps is for downstream
   * platforms that re-encode anyway (Instagram, TikTok).
   */
  fps: ExportFps;
};

export const EXPORT_PRESETS: Record<ExportPreset, ExportOptions> = {
  fast: {
    preset: "fast",
    bitrate: 6_000_000,
    scale: 0.5,
    keyframeIntervalSec: 2,
    fps: 60,
  },
  balanced: {
    preset: "balanced",
    bitrate: 16_000_000,
    scale: 1,
    keyframeIntervalSec: 1,
    fps: 60,
  },
  high: {
    preset: "high",
    bitrate: 50_000_000,
    scale: 1,
    // 0 means "smallest the export fps allows" — every frame becomes a
    // keyframe (all-intra), no inter-frame prediction shimmer on at-rest
    // text. local-export.ts clamps this to `1/exportFps` at runtime so the
    // intent survives whatever fps the user picks. Hardcoding 1/60 broke
    // 120fps exports: the encoder turned every other frame into a P-frame
    // and accumulated quantisation drift across them, visible on
    // text-heavy compositions at rest.
    keyframeIntervalSec: 0,
    fps: 120,
  },
};

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = EXPORT_PRESETS.balanced;

export function applyPreset(preset: ExportPreset): ExportOptions {
  return { ...EXPORT_PRESETS[preset] };
}
