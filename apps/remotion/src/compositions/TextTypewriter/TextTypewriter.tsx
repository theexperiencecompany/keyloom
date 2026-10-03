"use client";
import { AbsoluteFill, interpolate } from "remotion";
import { useCanvasLayout } from "../../use-canvas-layout";
import { useDesignFrame } from "../../use-design-frame";
import {
  APPLE_EASE,
  resolveTitleStyle,
  type TitleProps,
  TitleSubtitle,
} from "../title-shared";

export type TextTypewriterProps = TitleProps;

const HEADLINE_START = 8;
const CHAR_STAGGER = 2.76;
const CURSOR_BLINK_FRAMES = 18;

export const TextTypewriter: React.FC<TextTypewriterProps> = ({
  headline,
  subtitle,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { vmin } = useCanvasLayout();
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
        rise={14}
      />
    </AbsoluteFill>
  );
};
