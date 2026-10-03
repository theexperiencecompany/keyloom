"use client";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useCanvasLayout } from "../../use-canvas-layout";
import { useDesignFrame } from "../../use-design-frame";
import {
  APPLE_EASE,
  resolveTitleStyle,
  snap,
  snapNear,
  type TitleProps,
  TitleSubtitle,
} from "../title-shared";

export type TextScaleDownFadeProps = TitleProps;

const SCALE_EASE = Easing.bezier(0.22, 1, 0.36, 1);

const HEADLINE_START = 8;
const HEADLINE_DURATION = 31;

export const TextScaleDownFade: React.FC<TextScaleDownFadeProps> = ({
  headline,
  subtitle,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { vw, vh, vmin } = useCanvasLayout();
  const s = resolveTitleStyle(clipStyle);

  const headlineProgress = interpolate(
    frame,
    [HEADLINE_START, HEADLINE_START + HEADLINE_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SCALE_EASE },
  );

  const scale = snapNear(1.04 - headlineProgress * 0.04, 1);
  const y = vmin(0.74) * (1 - headlineProgress);

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
        padding: `0 ${vmin(7.4)}px`,
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: Math.min(vw(6.875), vh(12.22)),
          fontWeight: 700,
          letterSpacing: "-0.045em",
          lineHeight: 1.05,
          margin: 0,
          maxWidth: "16em",
          opacity: headlineProgress,
          transform: `translate3d(0, ${snap(y)}px, 0) scale(${scale})`,
        }}
      >
        {headline}
      </h1>

      <TitleSubtitle
        text={subtitle}
        progress={subtitleProgress}
        textColor={s.color}
      />
    </AbsoluteFill>
  );
};
