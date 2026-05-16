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

// Soft-blur-in without inter-character halo bleed.
//
// Per-character filter:blur causes each char's halo to extend into the
// neighbouring char's bounding box. When one char is settled but its
// neighbour is mid-blur, the neighbour's halo edge flickers across the
// settled char's pixels — visible as 1-px back-and-forth jitter even
// though every per-char value is monotonic.
//
// Solution: one filter:blur on the whole <h1>. A single Gaussian kernel
// is applied to the composited result of all chars, so there's no
// per-char halo to bleed. The kernel value is integer-snapped so
// adjacent frames within a step are rasterised identically. Chars
// stagger in via opacity alone — their layout is stable, no transforms.
// The headline-wide blur fades over a window long enough to overlap
// every char's fade-in stagger, giving each char some focus-pull time.
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

  const headlineProgress = interpolate(
    frame,
    [HEADLINE_START, lastCharEnd],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: APPLE_EASE,
    },
  );
  const headlineBlurPx = Math.round((1 - headlineProgress) * MAX_BLUR_PX);

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
          filter: headlineBlurPx > 0 ? `blur(${headlineBlurPx}px)` : undefined,
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
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: progress,
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
