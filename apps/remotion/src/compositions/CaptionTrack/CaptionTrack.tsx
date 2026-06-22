"use client";
import { AbsoluteFill, spring, useVideoConfig } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { useCanvasLayout } from "../../use-canvas-layout";
import { useDesignFrame } from "../../use-design-frame";

export type CaptionTrackProps = {
  text: string;
  wordsPerSecond: number;
  clipStyle?: ClipStyle;
};

export const CaptionTrack: React.FC<CaptionTrackProps> = ({
  text,
  wordsPerSecond,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();
  const { vmin } = useCanvasLayout();
  const s = resolveClipStyle(clipStyle, {
    background: "#ffffff",
    color: "#0f1014",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#0a84ff",
  });

  const words = text.trim().split(/\s+/).filter(Boolean);
  const framesPerWord = Math.max(
    1,
    Math.round(fps / Math.max(0.5, wordsPerSecond)),
  );
  const startOffset = 8;

  const adjustedFrame = frame - startOffset;
  const wordIndex =
    adjustedFrame < 0
      ? -1
      : Math.min(words.length - 1, Math.floor(adjustedFrame / framesPerWord));
  const localFrame = adjustedFrame - wordIndex * framesPerWord;

  const wordPop = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 220, mass: 0.5 },
  });

  const word = wordIndex >= 0 ? (words[wordIndex] ?? "") : "";

  return (
    <AbsoluteFill
      style={{
        background: s.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `0 ${vmin(7)}px`,
        fontFamily: s.fontFamily,
      }}
    >
      {word && (
        <span
          style={{
            fontSize: vmin(12),
            fontWeight: 700,
            letterSpacing: "-0.045em",
            lineHeight: 1.05,
            color: s.color,
            textAlign: "center",
            maxWidth: "16em",
            transform: `scale(${0.7 + wordPop * 0.3})`,
            opacity: wordPop,
            display: "inline-block",
          }}
        >
          {word}
        </span>
      )}
    </AbsoluteFill>
  );
};
