"use client";
import { AbsoluteFill, Audio, useVideoConfig } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { useDesignFrame } from "../../use-design-frame";
import { FONTS, fontKeyFromFamily, type HAlign, type VAlign } from "./config";

export type CaptionWord = {
  start: number;
  end: number;
  text: string;
};

export type TikTokCaptionProps = {
  words: CaptionWord[];
  audioUrl?: string;
  captionVAlign?: VAlign;
  captionHAlign?: HAlign;
  // Multiplier on the base font size. 1 = medium, 0.7 small, 1.6 huge.
  fontScale?: number;
  clipStyle?: ClipStyle;
};

const BASE_FONT_SIZE = 132;

const VERT_TO_JUSTIFY: Record<VAlign, string> = {
  top: "flex-start",
  center: "center",
  bottom: "flex-end",
};

const HORIZ_TO_ALIGN: Record<HAlign, string> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

const HORIZ_TO_TEXT_ALIGN: Record<HAlign, "left" | "center" | "right"> = {
  left: "left",
  center: "center",
  right: "right",
};

export const TikTokCaption: React.FC<TikTokCaptionProps> = ({
  words,
  audioUrl,
  captionVAlign = "center",
  captionHAlign = "center",
  fontScale = 1,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { fps, width, height } = useVideoConfig();

  const s = resolveClipStyle(clipStyle, {
    background: "transparent",
    color: "#ffffff",
    fontFamily: "'Anton', Impact, sans-serif",
    accent: "#ffffff",
  });

  const fontKey = fontKeyFromFamily(s.fontFamily);
  const font = FONTS[fontKey];

  const timeSeconds = frame / fps;

  let activeIndex = -1;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!w) continue;
    if (timeSeconds >= w.start && timeSeconds < w.end) {
      activeIndex = i;
      break;
    }
    if (timeSeconds < w.start) {
      activeIndex = i - 1;
      break;
    }
    if (i === words.length - 1 && timeSeconds >= w.end) {
      activeIndex = i;
    }
  }

  const activeWord = activeIndex >= 0 ? words[activeIndex] : undefined;

  const shortSide = Math.min(width, height);
  const baseSize = (BASE_FONT_SIZE * shortSide) / 1080;
  const fontSize = baseSize * fontScale;
  const strokeWidth = Math.max(2, fontSize * 0.06);

  const isTransparent = s.background === "transparent";

  return (
    <AbsoluteFill
      style={{
        background: isTransparent ? "transparent" : s.background,
        fontFamily: font.cssFamily,
        fontWeight: font.weight,
        display: "flex",
        flexDirection: "column",
        alignItems: HORIZ_TO_ALIGN[captionHAlign],
        justifyContent: VERT_TO_JUSTIFY[captionVAlign],
        padding: `${height * 0.08}px ${width * 0.06}px`,
      }}
    >
      {audioUrl ? <Audio src={audioUrl} /> : null}

      {activeWord ? (
        <span
          key={activeIndex}
          style={{
            display: "inline-block",
            fontSize,
            fontWeight: font.weight,
            letterSpacing: "-0.01em",
            color: s.color,
            WebkitTextStroke: `${strokeWidth}px #000`,
            paintOrder: "stroke fill",
            textShadow: isTransparent
              ? `0 ${fontSize * 0.025}px ${fontSize * 0.06}px rgba(0,0,0,0.55)`
              : `0 ${fontSize * 0.02}px ${fontSize * 0.04}px rgba(0,0,0,0.5)`,
            textAlign: HORIZ_TO_TEXT_ALIGN[captionHAlign],
            lineHeight: 1.05,
          }}
        >
          {activeWord.text}
        </span>
      ) : null}
    </AbsoluteFill>
  );
};
