"use client";
import { AbsoluteFill, interpolate } from "remotion";
import { useCanvasLayout } from "../../use-canvas-layout";
import { useDesignFrame } from "../../use-design-frame";
import { useFontReady } from "../../use-font-ready";
import {
  APPLE_EASE,
  resolveTitleStyle,
  type TitleProps,
  TitleSubtitle,
} from "../title-shared";

export type TitleTypeProps = TitleProps;

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
  const { vmin } = useCanvasLayout();
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

      <TitleSubtitle
        text={subtitle}
        progress={subtitleProgress}
        textColor={s.color}
      />
    </AbsoluteFill>
  );
};
