/**
 * Universal visual styling that every non-locked composition exposes.
 *
 * The Studio Inspector renders a "Style" section above each clip's
 * composition-specific Fields. Whatever the user sets here is stored on
 * `Clip.style` and forwarded to the composition via the `clipStyle` prop.
 *
 * Empty strings count as "no override" so the composition keeps its built-in
 * default.
 */
export type ClipStyle = {
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  accentColor?: string;
};

export type ClipStyleDefaults = {
  background: string;
  color: string;
  fontFamily: string;
  accent: string;
};

/**
 * Merge a per-clip ClipStyle override on top of a composition's hardcoded
 * defaults. Use it on the outermost AbsoluteFill of any component that opts
 * into universal styling.
 *
 * @example
 *   const s = resolveClipStyle(clipStyle, {
 *     background: "#fff",
 *     color: "#0f1014",
 *     fontFamily: "Inter, sans-serif",
 *     accent: "#6366f1",
 *   });
 *
 *   <AbsoluteFill style={{ background: s.background, color: s.color, fontFamily: s.fontFamily }}>
 */
export function resolveClipStyle(
  override: ClipStyle | undefined,
  defaults: ClipStyleDefaults,
): ClipStyleDefaults {
  return {
    background: pick(override?.backgroundColor, defaults.background),
    color: pick(override?.textColor, defaults.color),
    fontFamily: pick(override?.fontFamily, defaults.fontFamily),
    accent: pick(override?.accentColor, defaults.accent),
  };
}

function pick(value: string | undefined, fallback: string): string {
  if (value === undefined || value === null) return fallback;
  if (value.trim() === "") return fallback;
  return value;
}
