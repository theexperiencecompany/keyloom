"use client";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { useDesignFrame } from "../../use-design-frame";

export type TextMorphProps = {
  /** One word/phrase per line — the text morphs from each to the next. */
  text: string;
  clipStyle?: ClipStyle;
};

// Authored at 60fps (DESIGN_FPS); useDesignFrame keeps the timing wall-clock
// stable when a project is exported at a higher fps.
const MORPH_FRAMES = 45; // time spent blending one word into the next
const HOLD_FRAMES = 18; // time each word sits fully readable before morphing
const CYCLE = MORPH_FRAMES + HOLD_FRAMES;

// Gooey "threshold" blur math from the original effect. As a word fades in its
// blur shrinks from large → 0; opacity ramps with a gentle 0.4 power curve so
// the letters feel like they coalesce out of liquid. Guard o ≤ 0 (fully
// hidden) so we never emit `blur(Infinity)`.
function blurPx(o: number): number {
  if (o <= 0) return 100;
  return Math.min(8 / o - 8, 100);
}

export const TextMorph: React.FC<TextMorphProps> = ({ text, clipStyle }) => {
  const frame = useDesignFrame();
  const { width } = useVideoConfig();
  const s = resolveClipStyle(clipStyle, {
    background: "#ffffff",
    color: "#0b84f3",
    fontFamily: "'Raleway', system-ui, sans-serif",
    accent: "#0b84f3",
  });

  const words = text.split("\n").filter((w) => w.trim().length > 0);
  const n = words.length || 1;

  const idx = Math.floor(frame / CYCLE);
  const pos = frame % CYCLE;
  // 0 while holding the current word, then ramps 0 → 1 across the morph.
  const f =
    pos < HOLD_FRAMES ? 0 : Math.min(1, (pos - HOLD_FRAMES) / MORPH_FRAMES);

  const outgoing = words[idx % n] ?? "";
  const incoming = words[(idx + 1) % n] ?? "";

  const inOpacity = f ** 0.4;
  const outOpacity = (1 - f) ** 0.4;

  const fontSize = Math.min(width * 0.14, 220);

  const spanStyle: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    display: "inline-block",
    textAlign: "center",
    userSelect: "none",
    fontFamily: s.fontFamily,
    fontSize,
    fontWeight: 700,
    color: s.color,
  };

  return (
    <AbsoluteFill style={{ background: s.background }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // The threshold filter is what fuses the two blurred words into one
          // gooey shape — comment it out to see the raw crossfade.
          filter: "url(#textMorphThreshold) blur(0.6px)",
        }}
      >
        <span
          style={{
            ...spanStyle,
            opacity: outOpacity,
            filter: `blur(${blurPx(1 - f).toFixed(2)}px)`,
          }}
        >
          {outgoing}
        </span>
        <span
          style={{
            ...spanStyle,
            opacity: inOpacity,
            filter: `blur(${blurPx(f).toFixed(2)}px)`,
          }}
        >
          {incoming}
        </span>
      </div>

      <svg
        style={{ position: "absolute", width: 0, height: 0 }}
        aria-hidden="true"
      >
        <defs>
          <filter id="textMorphThreshold">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>
    </AbsoluteFill>
  );
};
