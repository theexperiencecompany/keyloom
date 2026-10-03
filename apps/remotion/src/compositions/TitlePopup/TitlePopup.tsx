"use client";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useCanvasLayout } from "../../use-canvas-layout";
import { useDesignFrame } from "../../use-design-frame";
import { useFontReady } from "../../use-font-ready";
import {
  APPLE_EASE,
  resolveTitleStyle,
  type TitleProps,
  TitleSubtitle,
} from "../title-shared";

export type TitlePopupProps = TitleProps;

const POP_EASE = Easing.out(Easing.back(2));

const HEADLINE_START = 6;
const SCALE_DURATION = 22;
const OPACITY_DURATION = 10;
const SUBTITLE_DELAY = 26;
const SUBTITLE_DURATION = 26;

export const TitlePopup: React.FC<TitlePopupProps> = ({
  headline,
  subtitle,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { vmin } = useCanvasLayout();
  const s = resolveTitleStyle(clipStyle);
  useFontReady(s.fontFamily);

  const scaleProgress = interpolate(
    frame,
    [HEADLINE_START, HEADLINE_START + SCALE_DURATION],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: POP_EASE,
    },
  );
  const scale = 0.4 + scaleProgress * 0.6;

  const opacity = interpolate(
    frame,
    [HEADLINE_START, HEADLINE_START + OPACITY_DURATION],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const subtitleStart = HEADLINE_START + SUBTITLE_DELAY;
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
          opacity,
          transform: `scale(${scale})`,
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
