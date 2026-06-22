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

export type TextPerWordCrossfadeProps = TitleProps;

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

const HEADLINE_START = 8;
const WORD_STAGGER = 4.2;
const WORD_DURATION = 42;

export const TextPerWordCrossfade: React.FC<TextPerWordCrossfadeProps> = ({
  headline,
  subtitle,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { vmin } = useCanvasLayout();
  const s = resolveTitleStyle(clipStyle);
  const words = headline.trim().split(/\s+/).filter(Boolean);

  const lastWordEnd =
    HEADLINE_START + (words.length - 1) * WORD_STAGGER + WORD_DURATION;
  const subtitleStart = lastWordEnd + 14;
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
          fontWeight: 700,
          letterSpacing: "-0.045em",
          lineHeight: 1.05,
          margin: 0,
          maxWidth: "16em",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.28em",
        }}
      >
        {words.map((word, i) => {
          const start = HEADLINE_START + i * WORD_STAGGER;
          const progress = interpolate(
            frame,
            [start, start + WORD_DURATION],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: APPLE_EASE,
            },
          );
          const y = vmin(0.74) * (1 - progress);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: progress,
                transform: `translate3d(0, ${snap(y)}px, 0)`,
              }}
            >
              {word}
            </span>
          );
        })}
      </h1>

      {subtitle.trim() && (
        <p
          style={{
            fontSize: vmin(3.5),
            fontWeight: 400,
            letterSpacing: "-0.012em",
            margin: `${vmin(3)}px 0 0`,
            maxWidth: "40em",
            color: getSubtitleColor(s.color),
            opacity: subtitleProgress,
            transform: `translate3d(0, ${snap((1 - subtitleProgress) * vmin(1.3))}px, 0)`,
          }}
        >
          {subtitle}
        </p>
      )}
    </AbsoluteFill>
  );
};
