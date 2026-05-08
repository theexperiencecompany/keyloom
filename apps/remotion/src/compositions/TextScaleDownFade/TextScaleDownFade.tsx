"use client";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import {
  getSubtitleColor,
  TITLE_FONT_FAMILY,
  type TitleProps,
} from "../title-shared";

export type TextScaleDownFadeProps = TitleProps;

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const SCALE_EASE = Easing.bezier(0.22, 1, 0.36, 1);

const HEADLINE_START = 8;
const HEADLINE_DURATION = 31;

export const TextScaleDownFade: React.FC<TextScaleDownFadeProps> = ({
  headline,
  subtitle,
  backgroundColor,
  textColor,
}) => {
  const frame = useCurrentFrame();

  const headlineProgress = interpolate(
    frame,
    [HEADLINE_START, HEADLINE_START + HEADLINE_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SCALE_EASE },
  );

  const scale = 1.04 - headlineProgress * 0.04;
  const y = 8 * (1 - headlineProgress);

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
        background: backgroundColor,
        color: textColor,
        fontFamily: TITLE_FONT_FAMILY,
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
          transform: `translateY(${y}px) scale(${scale})`,
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
            color: getSubtitleColor(textColor),
            opacity: subtitleProgress,
            transform: `translateY(${(1 - subtitleProgress) * 14}px)`,
            willChange: "transform, opacity",
          }}
        >
          {subtitle}
        </p>
      )}
    </AbsoluteFill>
  );
};
