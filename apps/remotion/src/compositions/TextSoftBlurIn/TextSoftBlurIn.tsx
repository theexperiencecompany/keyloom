"use client";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useDesignFrame } from "../../use-design-frame";
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
const BLUR_RADIUS = 8;

// "Soft blur in" without rendering jitter. The traditional approach
// — animating filter: blur(N) on each character — produces 1-px AA
// wobble during animation because Chromium's Gaussian filter is
// unstable when the kernel radius changes sub-pixel each frame. We
// avoid that by never animating the filter value: a STATIC blurred
// ghost is overlaid on each sharp character and the two crossfade by
// opacity. Crossfading opacity does not allocate filter buffers, so
// adjacent frames produce byte-identical-ish output and the eye sees
// a smooth focus-pull instead of glyph-edge shimmer.
export const TextSoftBlurIn: React.FC<TextSoftBlurInProps> = ({
  headline,
  subtitle,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const s = resolveTitleStyle(clipStyle);
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
          // Sharp character fades 0 → 1 over its window.
          const sharpOpacity = progress;
          // Static-blur ghost rides a bell curve so it appears AND
          // disappears within the same window: at progress=0 it is
          // invisible (so unstarted chars aren't pre-rendered) and at
          // progress=1 it is invisible (only the sharp version remains).
          const blurOpacity = 4 * progress * (1 - progress);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                position: "relative",
                whiteSpace: "pre",
              }}
            >
              <span style={{ opacity: sharpOpacity }}>
                {char === " " ? " " : char}
              </span>
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: blurOpacity,
                  filter: `blur(${BLUR_RADIUS}px)`,
                  pointerEvents: "none",
                }}
              >
                {char === " " ? " " : char}
              </span>
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
