"use client";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import {
  getSubtitleColor,
  resolveTitleStyle,
  snap,
  type TitleProps,
} from "../title-shared";

export type TextShortSlideDownProps = TitleProps;

const HEADLINE_START = 8;
const PUSH_FRAMES = 30;
const ENTER_FRAMES = 31;
const ENTER_EASE = Easing.bezier(0.2, 0.8, 0.2, 1);
const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const TextShortSlideDown: React.FC<TextShortSlideDownProps> = ({
  headline,
  subtitle,
  clipStyle,
}) => {
  const frame = useCurrentFrame();
  const s = resolveTitleStyle(clipStyle);
  const words = headline.trim().split(/\s+/).filter(Boolean);

  const lastWordStart = HEADLINE_START + (words.length - 1) * PUSH_FRAMES;
  const lastWordEnd = lastWordStart + ENTER_FRAMES;
  const subtitleStart = lastWordEnd + 14;
  const subtitleProgress = interpolate(
    frame,
    [subtitleStart, subtitleStart + 26],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: APPLE_EASE },
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
          lineHeight: 1.15,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {words.map((word, i) => {
          const wordStart = HEADLINE_START + i * PUSH_FRAMES;
          const progress = interpolate(
            frame,
            [wordStart, wordStart + ENTER_FRAMES],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: ENTER_EASE,
            },
          );
          const y = -28 * (1 - progress);
          const blur = 2.4 * (1 - progress);
          const scale = 0.992 + 0.008 * progress;
          const opacity = progress;
          return (
            <span
              key={i}
              style={{
                display: "block",
                opacity,
                transform: `translateY(${snap(y)}px) scale(${scale})`,
                filter: `blur(${blur}px)`,
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
