"use client";
import {
  AbsoluteFill,
  Img,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type CaptionTrackProps = {
  text: string;
  backgroundImageUrl: string;
  backgroundColor: string;
  textColor: string;
  outlineColor: string;
  wordsPerSecond: number;
};

export const CaptionTrack: React.FC<CaptionTrackProps> = ({
  text,
  backgroundImageUrl,
  backgroundColor,
  textColor,
  outlineColor,
  wordsPerSecond,
}) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  const words = text.trim().split(/\s+/).filter(Boolean);
  const framesPerWord = Math.max(1, Math.round(fps / Math.max(0.5, wordsPerSecond)));
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

  const word = wordIndex >= 0 ? words[wordIndex] ?? "" : "";

  const outline = `
    -3px -3px 0 ${outlineColor},
    3px -3px 0 ${outlineColor},
    -3px 3px 0 ${outlineColor},
    3px 3px 0 ${outlineColor},
    -3px 0 0 ${outlineColor},
    3px 0 0 ${outlineColor},
    0 -3px 0 ${outlineColor},
    0 3px 0 ${outlineColor},
    0 8px 18px rgba(0,0,0,0.45)
  `;

  return (
    <AbsoluteFill style={{ background: backgroundColor }}>
      {backgroundImageUrl.trim() && (
        <Img
          src={backgroundImageUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      {word && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: height * 0.7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 60px",
          }}
        >
          <span
            style={{
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
              fontSize: 132,
              fontWeight: 900,
              letterSpacing: "-0.025em",
              color: textColor,
              textTransform: "uppercase",
              textAlign: "center",
              lineHeight: 1.05,
              textShadow: outline,
              transform: `scale(${0.7 + wordPop * 0.3})`,
              opacity: wordPop,
              willChange: "transform, opacity",
              display: "inline-block",
            }}
          >
            {word}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
