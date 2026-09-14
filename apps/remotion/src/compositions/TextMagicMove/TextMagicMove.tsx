"use client";
import { measureText } from "@remotion/layout-utils";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Easing } from "remotion";
import type { ClipStyle } from "../../clip-style";
import { clamp01, lerp } from "../../lib/math";
import { useCanvasLayout } from "../../use-canvas-layout";
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

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

const FONT_WEIGHT = 700;
const LETTER_SPACING = "-0.02em";
const SPACE_EM = 0.3;
const LINE_STEP_EM = 1.18;
const SHIFT = 18;
const INTRO_SHIFT = 40;

export type TextMagicMoveProps = {
  phrases: string;
  fontSize: number;
  speed: number;
  clipStyle?: ClipStyle;
};

type WordBox = { text: string; cx: number; cy: number };
type Layout = { boxes: WordBox[]; widestLine: number };

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

function layoutPhrase(
  words: string[],
  fontFamily: string,
  fontSize: number,
  maxLineWidth: number,
): Layout {
  const measured = words.map((text) => ({
    text,
    width: measureWordWidth(text, fontFamily, fontSize),
  }));
  const space = fontSize * SPACE_EM;
  const lineWidth = (ws: { width: number }[]) =>
    ws.reduce((a, m) => a + m.width, 0) + space * Math.max(0, ws.length - 1);

  let lines = [measured];
  if (lineWidth(measured) > maxLineWidth && measured.length > 1) {
    let bestSplit = 1;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let k = 1; k < measured.length; k++) {
      const score = Math.max(
        lineWidth(measured.slice(0, k)),
        lineWidth(measured.slice(k)),
      );
      if (score < bestScore) {
        bestScore = score;
        bestSplit = k;
      }
    }
    lines = [measured.slice(0, bestSplit), measured.slice(bestSplit)];
  }

  const lineStep = fontSize * LINE_STEP_EM;
  const boxes: WordBox[] = [];
  lines.forEach((line, li) => {
    const cy = (li - (lines.length - 1) / 2) * lineStep;
    let cursor = -lineWidth(line) / 2;
    for (const m of line) {
      boxes.push({ text: m.text, cx: cursor + m.width / 2, cy });
      cursor += m.width + space;
    }
  });
  return { boxes, widestLine: Math.max(...lines.map(lineWidth)) };
}

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

function Word({
  text,
  cx,
  cy,
  dy = 0,
  opacity = 1,
  blur = 0,
}: {
  text: string;
  cx: number;
  cy: number;
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
        transform: `translate(-50%, -50%) translate3d(${snap(cx)}px, ${snap(cy + dy)}px, 0)`,
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
  fontSize: fontSizeProp,
  speed,
  clipStyle,
}) => {
  const frame = useDesignFrame() * normalizeSpeed(speed);
  const { vw, vmin } = useCanvasLayout();
  const baseFontSize = vmin((fontSizeProp / 1080) * 100);
  const safeWidth = vw(84);
  const shift = vmin((SHIFT / 1080) * 100);
  const introShift = vmin((INTRO_SHIFT / 1080) * 100);
  const s = resolveTitleStyle(clipStyle);
  useFontReady(s.fontFamily);
  const fontSettled = useFontSettled(s.fontFamily);

  const phraseWords = useMemo(() => parsePhrases(phrases), [phrases]);

  const { layouts, fontSize } = useMemo(() => {
    void fontSettled;
    const raw = phraseWords.map((w) =>
      layoutPhrase(w, s.fontFamily, baseFontSize, safeWidth),
    );
    const widest = Math.max(1, ...raw.map((l) => l.widestLine));
    const fit = Math.min(1, safeWidth / widest);
    return {
      fontSize: baseFontSize * fit,
      layouts: raw.map((l) => ({
        boxes: l.boxes.map((b) => ({
          text: b.text,
          cx: b.cx * fit,
          cy: b.cy * fit,
        })),
      })),
    };
  }, [phraseWords, s.fontFamily, baseFontSize, safeWidth, fontSettled]);

  const n = phraseWords.length;
  const segLen = MAGIC_HOLD + MAGIC_MORPH;
  const idx = Math.max(0, Math.min(n - 1, Math.floor(frame / segLen)));
  const local = frame - idx * segLen;
  const morphing = idx < n - 1 && local >= MAGIC_HOLD;

  let words: React.ReactNode[];

  if (morphing) {
    const A = layouts[idx]!;
    const B = layouts[idx + 1]!;
    const { aToB, bMatched } = matchWords(
      phraseWords[idx]!,
      phraseWords[idx + 1]!,
    );
    const pRaw = clamp01((local - MAGIC_HOLD) / MAGIC_MORPH);
    const p = APPLE_EASE(pRaw);
    const exit = APPLE_EASE(clamp01(pRaw / 0.6));
    const enter = APPLE_EASE(clamp01((pRaw - 0.4) / 0.6));

    const out: React.ReactNode[] = [];
    A.boxes.forEach((box, i) => {
      const j = aToB[i];
      if (j != null) {
        out.push(
          <Word
            key={`m-${i}`}
            text={box.text}
            cx={lerp(box.cx, B.boxes[j]!.cx, p)}
            cy={lerp(box.cy, B.boxes[j]!.cy, p)}
          />,
        );
      } else {
        out.push(
          <Word
            key={`x-${i}`}
            text={box.text}
            cx={box.cx}
            cy={box.cy}
            dy={-exit * shift}
            opacity={1 - exit}
            blur={exit * 8}
          />,
        );
      }
    });
    B.boxes.forEach((box, j) => {
      if (bMatched[j]) return;
      out.push(
        <Word
          key={`e-${j}`}
          text={box.text}
          cx={box.cx}
          cy={box.cy}
          dy={(1 - enter) * shift}
          opacity={enter}
          blur={(1 - enter) * 8}
        />,
      );
    });
    words = out;
  } else {
    const layout = layouts[idx]!;
    const isIntro = idx === 0;
    words = layout.boxes.map((box, i) => {
      if (!isIntro) {
        return <Word key={`s-${i}`} text={box.text} cx={box.cx} cy={box.cy} />;
      }
      const start = i * 4;
      const introP = APPLE_EASE(clamp01((frame - start) / MAGIC_ENTER));
      return (
        <Word
          key={`s-${i}`}
          text={box.text}
          cx={box.cx}
          cy={box.cy}
          dy={(1 - introP) * introShift}
          opacity={introP}
          blur={(1 - introP) * 6}
        />
      );
    });
  }

  return (
    <AbsoluteFill
      style={{
        background: s.background,
        color: s.color,
        fontFamily: s.fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `0 ${vw(8)}px`,
        overflow: "hidden",
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
  );
};
