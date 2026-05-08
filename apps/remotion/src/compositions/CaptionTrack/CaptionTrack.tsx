"use client";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type CaptionTrackProps = {
  text: string;
  backgroundColor: string;
  textColor: string;
  wordsPerSecond: number;
};

export const CaptionTrack: React.FC<CaptionTrackProps> = ({
  text,
  backgroundColor,
  textColor,
  wordsPerSecond,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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
        background: backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
      }}
    >
      {word && (
        <span
          style={{
            fontSize: 132,
            fontWeight: 700,
            letterSpacing: "-0.045em",
            lineHeight: 1.05,
            color: textColor,
            textAlign: "center",
            transform: `scale(${0.7 + wordPop * 0.3})`,
            opacity: wordPop,
            willChange: "transform, opacity",
            display: "inline-block",
          }}
        >
          {word}
        </span>
      )}
    </AbsoluteFill>
  );
};
