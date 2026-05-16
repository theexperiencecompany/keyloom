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

export type TitleTypeProps = TitleProps;

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

const HEADLINE_START = 8;
const FRAMES_PER_CHAR = 2;
const SUBTITLE_DELAY = 24;
const SUBTITLE_DURATION = 26;
const CURSOR_BLINK_FRAMES = 18;

export const TitleType: React.FC<TitleTypeProps> = ({
  headline,
  subtitle,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const s = resolveTitleStyle(clipStyle);
  useFontReady(s.fontFamily);
  const elapsed = Math.max(0, frame - HEADLINE_START);
  const visibleChars = Math.min(
    headline.length,
    Math.floor(elapsed / FRAMES_PER_CHAR),
  );
  const headlineDone = visibleChars >= headline.length;
  const headlineEnd = HEADLINE_START + headline.length * FRAMES_PER_CHAR;
  const subtitleStart = headlineEnd + SUBTITLE_DELAY;

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
            transform: `translate3d(0, ${snap((1 - subtitleProgress) * 14)}px, 0)`,
          }}
        >
          {subtitle}
        </p>
      )}
    </AbsoluteFill>
  );
};
