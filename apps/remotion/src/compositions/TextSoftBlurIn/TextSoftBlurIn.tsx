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

export type TextSoftBlurInProps = TitleProps;

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const CHAR_EASE = Easing.bezier(0.22, 1, 0.36, 1);

const HEADLINE_START = 8;
const CHAR_DURATION = 54;
const CHAR_STAGGER = 1.5;
const MAX_BLUR_PX = 12;
const MAX_RISE_PX = 16;

// Each character fades in, rises up, and de-blurs over its own
// stagger window. To avoid the 1-px AA flutter that smooth filter:
// blur radius changes cause, the radius is snapped to integer pixels
// — adjacent frames share the same Gaussian kernel until the rounded
// radius actually changes, so the rasterized glyph stays stable
// between those steps. Visually it still reads as a smooth focus-in
// because integer-px blur steps at this radius (12→0) are small
// relative to the glyph size.
export const TextSoftBlurIn: React.FC<TextSoftBlurInProps> = ({
  headline,
  subtitle,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const s = resolveTitleStyle(clipStyle);
  useFontReady(s.fontFamily);
  const chars = headline.split("");

  const lastCharEnd =
    HEADLINE_START + (chars.length - 1) * CHAR_STAGGER + CHAR_DURATION;
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
          const startFrame = HEADLINE_START + i * CHAR_STAGGER;
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
          const y = Math.round((1 - progress) * MAX_RISE_PX);
          const blurPx = Math.round((1 - progress) * MAX_BLUR_PX);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: progress,
                transform: `translate3d(0, ${y}px, 0)`,
                filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
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
            transform: `translate3d(0, ${snap((1 - subtitleProgress) * 14)}px, 0)`,
          }}
        >
          {subtitle}
        </p>
      )}
    </AbsoluteFill>
  );
};
