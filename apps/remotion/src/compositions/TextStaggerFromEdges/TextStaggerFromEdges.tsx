"use client";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import {
  getSubtitleColor,
  resolveTitleStyle,
  snap,
  type TitleProps,
} from "../title-shared";

export type TextStaggerFromEdgesProps = TitleProps;

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const CHAR_EASE = Easing.bezier(0.22, 1, 0.36, 1);

const HEADLINE_START = 8;
const CHAR_DURATION = 37;
const CHAR_STAGGER = 1.32;

export const TextStaggerFromEdges: React.FC<TextStaggerFromEdgesProps> = ({
  headline,
  subtitle,
  clipStyle,
}) => {
  const frame = useCurrentFrame();
  const s = resolveTitleStyle(clipStyle);
  const chars = headline.split("");
  const center = (chars.length - 1) / 2;
  const maxDist = center;

  const lastCharEnd = HEADLINE_START + maxDist * CHAR_STAGGER + CHAR_DURATION;
  const subtitleStart = lastCharEnd + 14;
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
        }}
      >
        {chars.map((char, i) => {
          const distFromCenter = Math.abs(i - center);
          const staggerFromEdge = maxDist - distFromCenter;
          const startFrame = HEADLINE_START + staggerFromEdge * CHAR_STAGGER;
          const progress = interpolate(
            frame,
            [startFrame, startFrame + CHAR_DURATION],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: CHAR_EASE,
            },
          );
          const opacity = progress;
          const y = (1 - progress) * 12;
          const blur = (1 - progress) * 3;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity,
                transform: `translateY(${snap(y)}px)`,
                filter: `blur(${blur}px)`,
                willChange: "transform, opacity",
                whiteSpace: "pre",
              }}
            >
              {char === " " ? " " : char}
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
