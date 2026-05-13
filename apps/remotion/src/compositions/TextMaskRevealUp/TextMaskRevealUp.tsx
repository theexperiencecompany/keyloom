"use client";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import {
  getSubtitleColor,
  resolveTitleStyle,
  snap,
  type TitleProps,
} from "../title-shared";

export type TextMaskRevealUpProps = TitleProps;

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const LINE_EASE = Easing.bezier(0.22, 1, 0.36, 1);

const HEADLINE_START = 8;
const LINE_STAGGER = 5.4;
const LINE_DURATION = 46;

export const TextMaskRevealUp: React.FC<TextMaskRevealUpProps> = ({
  headline,
  subtitle,
  clipStyle,
}) => {
  const frame = useCurrentFrame();
  const s = resolveTitleStyle(clipStyle);

  const lines = headline.split("\n").filter((l) => l.trim());

  const lastLineStart = HEADLINE_START + (lines.length - 1) * LINE_STAGGER;
  const subtitleStart = lastLineStart + LINE_DURATION + 14;
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
          fontSize: 96,
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1.2,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {lines.map((line, i) => {
          const lineStart = HEADLINE_START + i * LINE_STAGGER;
          const progress = interpolate(
            frame,
            [lineStart, lineStart + LINE_DURATION],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: LINE_EASE,
            },
          );
          return (
            <span
              key={i}
              style={{
                opacity: progress,
                transform: `translateY(${snap(30 * (1 - progress))}px)`,
                filter: `blur(${6 * (1 - progress)}px)`,
                whiteSpace: "nowrap",
              }}
            >
              {line}
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
