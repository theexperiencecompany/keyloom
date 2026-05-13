"use client";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import {
  getSubtitleColor,
  resolveTitleStyle,
  snap,
  type TitleProps,
} from "../title-shared";

export type TextFocusBlurResolveProps = TitleProps;

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const FOCUS_EASE = Easing.bezier(0.22, 1, 0.36, 1);

const HEADLINE_START = 8;
const HEADLINE_DURATION = 46;

export const TextFocusBlurResolve: React.FC<TextFocusBlurResolveProps> = ({
  headline,
  subtitle,
  clipStyle,
}) => {
  const frame = useCurrentFrame();
  const s = resolveTitleStyle(clipStyle);

  const headlineProgress = interpolate(
    frame,
    [HEADLINE_START, HEADLINE_START + HEADLINE_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: FOCUS_EASE },
  );

  const scale = 1.01 - headlineProgress * 0.01;
  const y = 14 * (1 - headlineProgress);
  const blur = 14 * (1 - headlineProgress);

  const subtitleStart = HEADLINE_START + HEADLINE_DURATION + 14;
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
          lineHeight: 1.05,
          margin: 0,
          opacity: headlineProgress,
          transform: `translateY(${snap(y)}px) scale(${scale})`,
          filter: `blur(${blur}px)`,
          willChange: "transform, opacity",
        }}
      >
        {headline}
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
