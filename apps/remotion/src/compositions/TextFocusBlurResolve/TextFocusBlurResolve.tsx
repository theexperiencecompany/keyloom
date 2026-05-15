"use client";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useDesignFrame } from "../../use-design-frame";
import {
  getSubtitleColor,
  resolveTitleStyle,
  snap,
  snapNear,
  type TitleProps,
} from "../title-shared";

export type TextFocusBlurResolveProps = TitleProps;

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const FOCUS_EASE = Easing.bezier(0.22, 1, 0.36, 1);

const HEADLINE_START = 8;
const HEADLINE_DURATION = 46;
const STATIC_BLUR_PX = 10;

// Same root-cause fix as TextSoftBlurIn: animating filter:blur() with a
// smoothly-changing radius produces 1-px AA wobble per frame in
// Chromium's Gaussian filter. Instead the blur radius stays constant
// and two copies (sharp + blurred ghost) crossfade by opacity over the
// headline window. translate/scale live on the shared wrapper so both
// layers move as one rigid unit.
export const TextFocusBlurResolve: React.FC<TextFocusBlurResolveProps> = ({
  headline,
  subtitle,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const s = resolveTitleStyle(clipStyle);

  const headlineProgress = interpolate(
    frame,
    [HEADLINE_START, HEADLINE_START + HEADLINE_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: FOCUS_EASE },
  );

  const scale = snapNear(1.01 - headlineProgress * 0.01, 1);
  const y = 14 * (1 - headlineProgress);

  const subtitleStart = HEADLINE_START + HEADLINE_DURATION + 14;
  const subtitleProgress = interpolate(
    frame,
    [subtitleStart, subtitleStart + 26],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: APPLE_EASE },
  );

  const headlineCommon = {
    fontSize: 132,
    fontWeight: 700,
    letterSpacing: "-0.045em",
    lineHeight: 1.05,
    margin: 0,
  } as const;

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
      <div
        style={{
          position: "relative",
          transform: `translate3d(0, ${snap(y)}px, 0) scale(${scale})`,
        }}
      >
        <h1 style={{ ...headlineCommon, opacity: headlineProgress }}>
          {headline}
        </h1>
        <div
          aria-hidden
          style={{
            ...headlineCommon,
            position: "absolute",
            inset: 0,
            opacity: 1 - headlineProgress,
            filter: `blur(${STATIC_BLUR_PX}px)`,
            pointerEvents: "none",
          }}
        >
          {headline}
        </div>
      </div>

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
