"use client";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import {
  getSubtitleColor,
  resolveTitleStyle,
  snap,
  type TitleProps,
} from "../title-shared";

export type TextTypewriterProps = TitleProps;

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

const HEADLINE_START = 8;
const CHAR_STAGGER = 2.76;
const CURSOR_BLINK_FRAMES = 18;

export const TextTypewriter: React.FC<TextTypewriterProps> = ({
  headline,
  subtitle,
  clipStyle,
}) => {
  const frame = useCurrentFrame();
  const s = resolveTitleStyle(clipStyle);

  const visibleChars = Math.min(
    headline.length,
    Math.floor(Math.max(0, frame - HEADLINE_START) / CHAR_STAGGER),
  );
  const headlineDone = visibleChars >= headline.length;
  const headlineEnd = HEADLINE_START + headline.length * CHAR_STAGGER;
  const subtitleStart = headlineEnd + 24;

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

  const cursorOn = headlineDone
    ? Math.floor(frame / CURSOR_BLINK_FRAMES) % 2 === 0
    : true;

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
          whiteSpace: "pre-wrap",
        }}
      >
        {headline.slice(0, visibleChars)}
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: "0.06em",
            height: "0.95em",
            marginLeft: "0.08em",
            verticalAlign: "-0.12em",
            background: s.color,
            opacity: cursorOn ? 1 : 0,
          }}
        />
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
            transform: `translateY(${snap((1 - subtitleProgress) * 14)}px)`,
            willChange: "transform, opacity",
          }}
        >
          {subtitle}
        </p>
      )}
    </AbsoluteFill>
  );
};
