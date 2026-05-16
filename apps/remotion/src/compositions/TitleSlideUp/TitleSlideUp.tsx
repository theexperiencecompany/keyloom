"use client";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useDesignFrame } from "../../use-design-frame";
import { useFontReady } from "../../use-font-ready";
import {
  getSubtitleColor,
  resolveTitleStyle,
  snap,
  type TitleProps,
} from "../title-shared";

export type TitleSlideUpProps = TitleProps;

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

const HEADLINE_START = 8;
const WORD_STAGGER = 3;
const WORD_REVEAL = 32;
const SUBTITLE_DELAY = 14;
const SUBTITLE_DURATION = 26;

export const TitleSlideUp: React.FC<TitleSlideUpProps> = ({
  headline,
  subtitle,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const s = resolveTitleStyle(clipStyle);
  useFontReady(s.fontFamily);
  const words = headline.trim().split(/\s+/).filter(Boolean);

  const lastWordEnd =
    HEADLINE_START + (words.length - 1) * WORD_STAGGER + WORD_REVEAL;
  const subtitleStart = lastWordEnd + SUBTITLE_DELAY;

  const subtitleProgress = interpolate(
    frame,
    [subtitleStart, subtitleStart + SUBTITLE_DURATION],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: APPLE_EASE,
    },
  );

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
      <h1
        style={{
          fontSize: 132,
          fontWeight: 700,
          letterSpacing: "-0.045em",
          lineHeight: 1.05,
          margin: 0,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.28em",
        }}
      >
        {words.map((word, i) => (
          <RevealWord
            key={i}
            word={word}
            startFrame={HEADLINE_START + i * WORD_STAGGER}
            frame={frame}
          />
        ))}
      </h1>

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

function RevealWord({
  word,
  startFrame,
  frame,
}: {
  word: string;
  startFrame: number;
  frame: number;
}) {
  const progress = interpolate(
    frame,
    [startFrame, startFrame + WORD_REVEAL],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: APPLE_EASE,
    },
  );

  const translateY = (1 - progress) * 110;

  return (
    <span
      style={{
        display: "inline-block",
        overflow: "hidden",
        paddingBottom: "0.12em",
        verticalAlign: "bottom",
      }}
    >
      <span
        style={{
          display: "inline-block",
          transform: `translate3d(0, ${snap(translateY)}%, 0)`,
        }}
      >
        {word}
      </span>
    </span>
  );
}
