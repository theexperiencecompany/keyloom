import type { AnyCompositionInfo } from "@workspace/compositions/schema";

export type ResolvedMeta = {
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
};

/**
 * The metadata the docs/preview should actually use.
 *
 * A composition can declare `calculateMetadata` to grow its timeline and reshape
 * its canvas to fit the current props — e.g. MessageBubbles extends the duration
 * to fit the conversation and swaps to portrait dimensions. The editor runs that
 * function, but the docs preview/stats historically read only the STATIC
 * registry values, so a long/portrait composition showed the wrong duration
 * (11s vs the editor's 22s) and the wrong aspect.
 *
 * This applies `calculateMetadata` when it resolves synchronously (as the docs
 * render synchronously), so the docs match the editor. It falls back to the
 * static registry values for compositions without `calculateMetadata`, or whose
 * `calculateMetadata` is async or throws.
 */
export function resolveCompositionMeta(
  info: AnyCompositionInfo,
  props?: Record<string, unknown>,
): ResolvedMeta {
  const base: ResolvedMeta = {
    durationInFrames: info.durationInFrames,
    fps: info.fps,
    width: info.width,
    height: info.height,
  };
  if (!info.calculateMetadata) return base;
  try {
    const result = info.calculateMetadata({
      props: props ?? info.defaultProps,
    });
    // The docs render synchronously, so an async result can't be used here.
    if (result && typeof (result as { then?: unknown }).then === "function") {
      return base;
    }
    const m = result as ResolvedMeta;
    return {
      durationInFrames:
        typeof m.durationInFrames === "number"
          ? m.durationInFrames
          : base.durationInFrames,
      fps: typeof m.fps === "number" ? m.fps : base.fps,
      width: typeof m.width === "number" ? m.width : base.width,
      height: typeof m.height === "number" ? m.height : base.height,
    };
  } catch {
    return base;
  }
}
