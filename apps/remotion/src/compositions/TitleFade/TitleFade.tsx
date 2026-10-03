"use client";
import { AbsoluteFill, interpolate } from "remotion";
import { useCanvasLayout } from "../../use-canvas-layout";
import { useDesignFrame } from "../../use-design-frame";
import { useFontReady } from "../../use-font-ready";
import {
  APPLE_EASE,
  resolveTitleStyle,
  snap,
  type TitleProps,
  TitleSubtitle,
} from "../title-shared";

export type TitleFadeProps = TitleProps;

const HEADLINE_START = 8;
const HEADLINE_DURATION = 36;
const SUBTITLE_DELAY = 14;
const SUBTITLE_DURATION = 26;

export const TitleFade: React.FC<TitleFadeProps> = ({
  headline,
  subtitle,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { vmin } = useCanvasLayout();
  const s = resolveTitleStyle(clipStyle);
  useFontReady(s.fontFamily);

  const headlineProgress = interpolate(
    frame,
    [HEADLINE_START, HEADLINE_START + HEADLINE_DURATION],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: APPLE_EASE,
    },
  );

  const subtitleStart = HEADLINE_START + HEADLINE_DURATION + SUBTITLE_DELAY;
  const subtitleProgress = interpolate(
    frame,
    [subtitleStart, subtitleStart + SUBTITLE_DURATION],
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
        padding: `0 ${vmin(7)}px`,
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: vmin(12),
          fontWeight: 700,
          letterSpacing: "-0.045em",
          lineHeight: 1.05,
          margin: 0,
          maxWidth: "16em",
          opacity: headlineProgress,
          transform: `translate3d(0, ${snap((1 - headlineProgress) * vmin(2.2))}px, 0)`,
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
