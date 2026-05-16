"use client";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useDesignFrame } from "../../use-design-frame";
import { useFontReady } from "../../use-font-ready";
import {
  getSubtitleColor,
  resolveTitleStyle,
  snap,
  snapNear,
  type TitleProps,
} from "../title-shared";

export type TextShortSlideDownProps = TitleProps;

const HEADLINE_START = 8;
const PUSH_FRAMES = 30;
const ENTER_FRAMES = 31;
const ENTER_EASE = Easing.bezier(0.2, 0.8, 0.2, 1);
const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const MAX_BLUR_PX = 8;

export const TextShortSlideDown: React.FC<TextShortSlideDownProps> = ({
  headline,
  subtitle,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const s = resolveTitleStyle(clipStyle);
  useFontReady(s.fontFamily);
  const words = headline.trim().split(/\s+/).filter(Boolean);

  const lastWordStart = HEADLINE_START + (words.length - 1) * PUSH_FRAMES;
  const lastWordEnd = lastWordStart + ENTER_FRAMES;
  const headlineProgress = interpolate(
    frame,
    [HEADLINE_START, lastWordEnd],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: APPLE_EASE,
    },
  );
  const headlineBlurPx = Math.round((1 - headlineProgress) * MAX_BLUR_PX);

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
          filter: headlineBlurPx > 0 ? `blur(${headlineBlurPx}px)` : undefined,
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
          const scale = snapNear(0.992 + 0.008 * progress, 1);
          return (
            <span
              key={i}
              style={{
                display: "block",
                opacity: progress,
                transform: `translate3d(0, ${snap(y)}px, 0) scale(${scale})`,
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
            transform: `translate3d(0, ${snap((1 - subtitleProgress) * 14)}px, 0)`,
          }}
        >
          {subtitle}
        </p>
      )}
    </AbsoluteFill>
  );
};
