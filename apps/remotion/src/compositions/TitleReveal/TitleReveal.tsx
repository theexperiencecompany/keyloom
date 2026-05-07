"use client";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";

export type TitleRevealProps = {
  headline: string;
  subtitle: string;
  backgroundColor: string;
  textColor: string;
};

const HEADLINE_START = 8;
const WORD_STAGGER = 3;
const WORD_REVEAL = 32;
const SUBTITLE_DELAY = 14;
const SUBTITLE_DURATION = 26;

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const TitleReveal: React.FC<TitleRevealProps> = ({
  headline,
  subtitle,
  backgroundColor,
  textColor,
}) => {
  const frame = useCurrentFrame();
  const words = headline.trim().split(/\s+/).filter(Boolean);

  const lastWordEnd =
    HEADLINE_START + (words.length - 1) * WORD_STAGGER + WORD_REVEAL;
  const subtitleStart = lastWordEnd + SUBTITLE_DELAY;

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

  const subtitleColor = isDarkColor(textColor)
    ? "rgba(15,16,20,0.55)"
    : "rgba(255,255,255,0.65)";

  return (
    <AbsoluteFill
      style={{
        background: backgroundColor,
        color: textColor,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
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
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.28em",
        }}
      >
        {words.map((word, i) => (
          <RevealWord
            key={i}
            word={word}
            startFrame={HEADLINE_START + i * WORD_STAGGER}
            frame={frame}
          />
        ))}
      </h1>

      {subtitle.trim() && (
        <p
          style={{
            fontSize: 38,
            fontWeight: 400,
            letterSpacing: "-0.012em",
            margin: "32px 0 0",
            color: subtitleColor,
            opacity: subtitleProgress,
            transform: `translateY(${(1 - subtitleProgress) * 14}px)`,
            willChange: "transform, opacity",
          }}
        >
          {subtitle}
        </p>
      )}
    </AbsoluteFill>
  );
};

function RevealWord({
  word,
  startFrame,
  frame,
}: {
  word: string;
  startFrame: number;
  frame: number;
}) {
  const progress = interpolate(
    frame,
    [startFrame, startFrame + WORD_REVEAL],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: APPLE_EASE,
    },
  );

  const translateY = (1 - progress) * 110;

  return (
    <span
      style={{
        display: "inline-block",
        overflow: "hidden",
        paddingBottom: "0.12em",
        verticalAlign: "bottom",
      }}
    >
      <span
        style={{
          display: "inline-block",
          transform: `translateY(${translateY}%)`,
          willChange: "transform",
        }}
      >
        {word}
      </span>
    </span>
  );
}

function isDarkColor(color: string): boolean {
  const c = color.trim().toLowerCase();
  if (c === "white" || c === "#fff" || c === "#ffffff") return true;
  if (c.startsWith("#") && c.length === 7) {
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6;
  }
  return false;
}
