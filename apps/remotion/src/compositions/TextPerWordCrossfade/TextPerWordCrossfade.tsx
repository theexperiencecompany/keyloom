"use client";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import {
  getSubtitleColor,
  resolveTitleStyle,
  snap,
  type TitleProps,
} from "../title-shared";

export type TextPerWordCrossfadeProps = TitleProps;

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

const HEADLINE_START = 8;
const WORD_STAGGER = 4.2;
const WORD_DURATION = 42;

export const TextPerWordCrossfade: React.FC<TextPerWordCrossfadeProps> = ({
  headline,
  subtitle,
  clipStyle,
}) => {
  const frame = useCurrentFrame();
  const s = resolveTitleStyle(clipStyle);
  const words = headline.trim().split(/\s+/).filter(Boolean);

  const lastWordEnd =
    HEADLINE_START + (words.length - 1) * WORD_STAGGER + WORD_DURATION;
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
        {words.map((word, i) => {
          const start = HEADLINE_START + i * WORD_STAGGER;
          const progress = interpolate(
            frame,
            [start, start + WORD_DURATION],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: APPLE_EASE,
            },
          );
          const y = 8 * (1 - progress);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: progress,
                transform: `translateY(${snap(y)}px)`,
                willChange: "transform, opacity",
              }}
            >
              {word}
            </span>
          );
        })}
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
            transform: `translateY(${snap((1 - subtitleProgress) * 14)}px)`,
            willChange: "transform, opacity",
          }}
        >
          {subtitle}
        </p>
      )}
    </AbsoluteFill>
  );
};
