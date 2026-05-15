"use client";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useDesignFrame } from "../../use-design-frame";
import {
  getSubtitleColor,
  resolveTitleStyle,
  snap,
  type TitleProps,
} from "../title-shared";

export type TextShortSlideRightProps = TitleProps;

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const SLIDE_EASE = Easing.bezier(0.2, 0.8, 0.2, 1);

const HEADLINE_START = 8;
const PHRASE_DURATION = 31;
const WORD_OPACITY_DURATION = 13;
const WORD_STAGGER = 5.5;

const HEADLINE_STYLE = {
  fontSize: 132,
  fontWeight: 700,
  letterSpacing: "-0.045em",
  lineHeight: 1.05,
  margin: 0,
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "0 0.28em",
} as const;

export const TextShortSlideRight: React.FC<TextShortSlideRightProps> = ({
  headline,
  subtitle,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const s = resolveTitleStyle(clipStyle);
  const words = headline.trim().split(/\s+/).filter(Boolean);

  const phraseProgress = interpolate(
    frame,
    [HEADLINE_START, HEADLINE_START + PHRASE_DURATION],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: SLIDE_EASE,
    },
  );
  const phraseX = -24 * (1 - phraseProgress);

  const lastWordEnd =
    HEADLINE_START + (words.length - 1) * WORD_STAGGER + WORD_OPACITY_DURATION;
  const subtitleStart = lastWordEnd + 14;
  const subtitleProgress = interpolate(
    frame,
    [subtitleStart, subtitleStart + 26],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: APPLE_EASE,
    },
  );

  const wordSpans = words.map((word, i) => {
    const wordOpacity = interpolate(
      frame,
      [
        HEADLINE_START + i * WORD_STAGGER,
        HEADLINE_START + i * WORD_STAGGER + WORD_OPACITY_DURATION,
      ],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    return (
      <span key={i} style={{ display: "inline-block", opacity: wordOpacity }}>
        {word}
      </span>
    );
  });

  return (
    <AbsoluteFill
      style={{
        background: s.background,
        color: s.color,
        fontFamily: s.fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          transform: `translate3d(${snap(phraseX)}px, 0, 0)`,
        }}
      >
        <h1 style={HEADLINE_STYLE}>{wordSpans}</h1>
        <div
          aria-hidden
          style={{
            ...HEADLINE_STYLE,
            position: "absolute",
            inset: 0,
            opacity: 1 - phraseProgress,
            filter: "blur(2px)",
            pointerEvents: "none",
          }}
        >
          {wordSpans}
        </div>
      </div>

      {subtitle.trim() && (
        <p
          style={{
            fontSize: 38,
            fontWeight: 400,
            letterSpacing: "-0.012em",
            margin: "32px 0 0",
            color: getSubtitleColor(s.color),
            opacity: subtitleProgress,
            transform: `translate3d(0, ${snap((1 - subtitleProgress) * 14)}px, 0)`,
          }}
        >
          {subtitle}
        </p>
      )}
    </AbsoluteFill>
  );
};
