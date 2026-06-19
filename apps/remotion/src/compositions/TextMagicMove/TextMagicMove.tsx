"use client";
import { measureText } from "@remotion/layout-utils";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Easing } from "remotion";
import type { ClipStyle } from "../../clip-style";
import { FitContent } from "../../fit-content";
import { useDesignFrame } from "../../use-design-frame";
import { useFontReady } from "../../use-font-ready";
import { resolveTitleStyle, snap, snapZero } from "../title-shared";
import {
  MAGIC_ENTER,
  MAGIC_HOLD,
  MAGIC_MORPH,
  normalizeSpeed,
  parsePhrases,
} from "./timing";

/**
 * Kinetic-typography MAGIC MOVE. Feed it a list of phrases (one per line); it
 * cycles through them and, at each hand-off, the *shared* words physically
 * travel from their old position to their new one (Keynote "Magic Move").
 * Words unique to the outgoing phrase blur up and out; words unique to the
 * incoming phrase blur in from below. Nothing hard-cuts — that continuous
 * motion across the seam is the whole illusion.
 *
 * This is distinct from the sibling `TextMorph` (a gooey blur-threshold melt
 * of single words). Use this one for multi-word headlines that share words
 * ("Motion makes it real" → "Motion makes it yours").
 *
 * Robust in the Player AND the export: layout is computed deterministically
 * with `measureText()` (no fragile live-DOM measurement), and every animated
 * property is `transform` / `opacity` / `filter: blur` — all of which the
 * in-browser export rasterizes correctly. No shaders, no Chrome flags, no SVG
 * filter refs.
 */

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

const FONT_WEIGHT = 700;
const LETTER_SPACING = "-0.02em";
const SPACE_EM = 0.3; // gap between words, in em
const SHIFT = 18; // px a unique word rises/drops as it fades
const INTRO_SHIFT = 40; // px the first phrase rises on entrance

export type TextMagicMoveProps = {
  /** One phrase per line. The clip morphs from each line to the next. */
  phrases: string;
  fontSize: number;
  /** Playback rate. 1 = normal, 2 = twice as fast, 0.5 = half speed. */
  speed: number;
  clipStyle?: ClipStyle;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Layout = { boxes: { text: string; cx: number }[] };

/**
 * Word width. `measureText()` throws outside a browser (no canvas), which
 * happens during Next's SSR/prerender of the docs preview. Fall back to a
 * cheap glyph-count estimate there; the real measurement runs once the
 * component renders in a real DOM (Player, export, and post-hydration), and
 * `useFontSettled` triggers a re-measure so the layout self-corrects.
 */
function measureWordWidth(
  text: string,
  fontFamily: string,
  fontSize: number,
): number {
  if (typeof document === "undefined") {
    return text.length * fontSize * 0.55;
  }
  return measureText({
    text,
    fontFamily,
    fontSize,
    fontWeight: FONT_WEIGHT,
    letterSpacing: LETTER_SPACING,
  }).width;
}

/** Lay a phrase out as one centered line; cx is each word's center x. */
function layoutPhrase(
  words: string[],
  fontFamily: string,
  fontSize: number,
): Layout {
  const measured = words.map((text) => ({
    text,
    width: measureWordWidth(text, fontFamily, fontSize),
  }));
  const space = fontSize * SPACE_EM;
  const total =
    measured.reduce((a, m) => a + m.width, 0) +
    space * Math.max(0, words.length - 1);
  let cursor = -total / 2;
  const boxes = measured.map((m) => {
    const cx = cursor + m.width / 2;
    cursor += m.width + space;
    return { text: m.text, cx };
  });
  return { boxes };
}

/**
 * Match words of phrase A to phrase B by text (case-insensitive), pairing the
 * k-th occurrence of a repeated word in A with the k-th in B. Returns, per
 * A-word, the B-index it maps to (null = exiting) and which B-indices got
 * matched (the rest are entering).
 */
function matchWords(a: string[], b: string[]) {
  const bByWord = new Map<string, number[]>();
  b.forEach((w, j) => {
    const k = w.toLowerCase();
    const q = bByWord.get(k);
    if (q) q.push(j);
    else bByWord.set(k, [j]);
  });
  const aToB: (number | null)[] = a.map(() => null);
  const bMatched = b.map(() => false);
  a.forEach((w, i) => {
    const q = bByWord.get(w.toLowerCase());
    if (q?.length) {
      const j = q.shift() as number;
      aToB[i] = j;
      bMatched[j] = true;
    }
  });
  return { aToB, bMatched };
}

/**
 * Re-render once webfonts settle so `measureText` reflects real metrics, not
 * the fallback. In headless export, `useFontReady` already holds frame capture
 * until the font loads, so the corrected measurement is what rasterizes.
 */
function useFontSettled(fontFamily: string): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) {
      setReady(true);
      return;
    }
    let alive = true;
    document.fonts.ready.then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [fontFamily]);
  return ready;
}

/** A single absolutely-positioned word. */
function Word({
  text,
  cx,
  dy = 0,
  opacity = 1,
  blur = 0,
}: {
  text: string;
  cx: number;
  dy?: number;
  opacity?: number;
  blur?: number;
}) {
  const b = snapZero(blur);
  return (
    <span
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        whiteSpace: "nowrap",
        transform: `translate(-50%, -50%) translate3d(${snap(cx)}px, ${snap(dy)}px, 0)`,
        opacity,
        filter: b === 0 ? undefined : `blur(${b}px)`,
        willChange: "transform, opacity, filter",
      }}
    >
      {text}
    </span>
  );
}

export const TextMagicMove: React.FC<TextMagicMoveProps> = ({
  phrases,
  fontSize,
  speed,
  clipStyle,
}) => {
  // Scale the timeline by `speed`: a higher rate makes the same motion play
  // out over fewer frames. meta's duration divides by the same factor so the
  // clip length tracks it.
  const frame = useDesignFrame() * normalizeSpeed(speed);
  const s = resolveTitleStyle(clipStyle);
  useFontReady(s.fontFamily);
  const fontSettled = useFontSettled(s.fontFamily);

  const phraseWords = useMemo(() => parsePhrases(phrases), [phrases]);

  // Deterministic per-phrase layouts, re-measured once the font settles so
  // measured widths match the rasterized glyphs.
  const layouts = useMemo(
    () => phraseWords.map((w) => layoutPhrase(w, s.fontFamily, fontSize)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phraseWords, s.fontFamily, fontSize, fontSettled],
  );

  const n = phraseWords.length;
  const segLen = MAGIC_HOLD + MAGIC_MORPH;
  const idx = Math.max(0, Math.min(n - 1, Math.floor(frame / segLen)));
  const local = frame - idx * segLen;
  const morphing = idx < n - 1 && local >= MAGIC_HOLD;

  let words: React.ReactNode[];

  if (morphing) {
    // idx < n-1 guarantees both layouts exist; assert past noUncheckedIndexedAccess.
    const A = layouts[idx]!;
    const B = layouts[idx + 1]!;
    const { aToB, bMatched } = matchWords(
      phraseWords[idx]!,
      phraseWords[idx + 1]!,
    );
    const pRaw = clamp01((local - MAGIC_HOLD) / MAGIC_MORPH);
    const p = APPLE_EASE(pRaw);
    // Exits resolve in the first 60%, entrances arrive in the last 60%, so
    // they overlap in the middle and the line is never empty.
    const exit = APPLE_EASE(clamp01(pRaw / 0.6));
    const enter = APPLE_EASE(clamp01((pRaw - 0.4) / 0.6));

    const out: React.ReactNode[] = [];
    A.boxes.forEach((box, i) => {
      const j = aToB[i];
      if (j != null) {
        // Shared word — glide from old position to new. This is the morph.
        out.push(
          <Word
            key={`m-${i}`}
            text={box.text}
            cx={lerp(box.cx, B.boxes[j]!.cx, p)}
          />,
        );
      } else {
        // Outgoing-only word — blur up and out.
        out.push(
          <Word
            key={`x-${i}`}
            text={box.text}
            cx={box.cx}
            dy={-exit * SHIFT}
            opacity={1 - exit}
            blur={exit * 8}
          />,
        );
      }
    });
    B.boxes.forEach((box, j) => {
      if (bMatched[j]) return;
      // Incoming-only word — blur in from below.
      out.push(
        <Word
          key={`e-${j}`}
          text={box.text}
          cx={box.cx}
          dy={(1 - enter) * SHIFT}
          opacity={enter}
          blur={(1 - enter) * 8}
        />,
      );
    });
    words = out;
  } else {
    // Static hold — or the first phrase's lightly-staggered entrance.
    const layout = layouts[idx]!;
    const isIntro = idx === 0;
    words = layout.boxes.map((box, i) => {
      if (!isIntro) {
        return <Word key={`s-${i}`} text={box.text} cx={box.cx} />;
      }
      const start = i * 4;
      const introP = APPLE_EASE(clamp01((frame - start) / MAGIC_ENTER));
      return (
        <Word
          key={`s-${i}`}
          text={box.text}
          cx={box.cx}
          dy={(1 - introP) * INTRO_SHIFT}
          opacity={introP}
          blur={(1 - introP) * 6}
        />
      );
    });
  }

  return (
    <FitContent
      designWidth={1920}
      designHeight={1080}
      background={s.background}
    >
      <AbsoluteFill
        style={{
          color: s.color,
          fontFamily: s.fontFamily,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 0,
            fontSize,
            fontWeight: FONT_WEIGHT,
            letterSpacing: LETTER_SPACING,
            lineHeight: 1,
          }}
        >
          {words}
        </div>
      </AbsoluteFill>
    </FitContent>
  );
};
