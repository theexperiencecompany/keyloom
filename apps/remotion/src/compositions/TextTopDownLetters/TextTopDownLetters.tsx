"use client";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useCanvasLayout } from "../../use-canvas-layout";
import { useDesignFrame } from "../../use-design-frame";
import {
  getSubtitleColor,
  resolveTitleStyle,
  snap,
  type TitleProps,
} from "../title-shared";

export type TextTopDownLettersProps = TitleProps;

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const CHAR_EASE = Easing.bezier(0.18, 1, 0.32, 1);

const HEADLINE_START = 8;
const CHAR_DURATION = 24;
const CHAR_STAGGER = 5.28;

export const TextTopDownLetters: React.FC<TextTopDownLettersProps> = ({
  headline,
  subtitle,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { vmin } = useCanvasLayout();
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
        padding: `0 ${vmin(7.4)}px`,
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: vmin(12.2),
          maxWidth: "16em",
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
          const opacity = progress;
          const y = (1 - progress) * vmin(-4.26);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity,
                transform: `translate3d(0, ${snap(y)}px, 0)`,
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
            fontSize: vmin(3.5),
            maxWidth: "40em",
            fontWeight: 400,
            letterSpacing: "-0.012em",
            margin: `${vmin(3)}px 0 0`,
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
