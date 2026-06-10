"use client";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";

export type BounceCardsProps = {
  images: string[];
  clipStyle?: ClipStyle;
};

// Fan layout for up to five cards — same idea as the original CSS
// `transformStyles`, expressed as discrete rotate + x-offset values so we can
// drive them with Remotion's frame-based spring instead of GSAP.
type CardLayout = { rotate: number; x: number };

const LAYOUT: CardLayout[] = [
  { rotate: 10, x: -340 },
  { rotate: 5, x: -170 },
  { rotate: -3, x: 0 },
  { rotate: -10, x: 170 },
  { rotate: 2, x: 340 },
];

const CARD_SIZE = 240;
const STAGGER_FRAMES = 4; // ~0.13s between each card popping in
const SPOTLIGHT_START = 70; // frame the hover-style spotlight cycle begins
const SPOTLIGHT_EVERY = 28; // frames each card stays centred/forward

export const BounceCards: React.FC<BounceCardsProps> = ({
  images,
  clipStyle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = resolveClipStyle(clipStyle, {
    background: "#0b1120",
    color: "#ffffff",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    accent: "#6366f1",
  });

  const count = images.length || 1;

  // Which card is currently "spotlit" (mimics the original hover-push). -1
  // until the spotlight phase starts, then cycles through the cards.
  const spotlight =
    frame < SPOTLIGHT_START
      ? -1
      : Math.floor((frame - SPOTLIGHT_START) / SPOTLIGHT_EVERY) % count;

  return (
    <AbsoluteFill
      style={{
        background: s.background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "relative", width: 0, height: 0 }}>
        {images.map((src, i) => {
          const layout = LAYOUT[i % LAYOUT.length] ?? { rotate: 0, x: 0 };

          // Elastic bounce-in: each card springs scale 0 → 1, staggered.
          // Low damping gives the overshoot/settle of `elastic.out`.
          const enter = spring({
            frame: frame - i * STAGGER_FRAMES,
            fps,
            config: { damping: 9, mass: 0.8, stiffness: 120 },
          });

          const isSpot = i === spotlight;

          // When spotlit, the card glides to centre, un-rotates and lifts —
          // the auto-play equivalent of hovering it. A sine envelope over the
          // card's window eases it forward then back, so there's no snap when
          // the spotlight moves on.
          const windowStart = SPOTLIGHT_START + spotlight * SPOTLIGHT_EVERY;
          const windowT = (frame - windowStart) / SPOTLIGHT_EVERY;
          const spotAmt = isSpot ? Math.sin(windowT * Math.PI) : 0;

          const x = interpolate(spotAmt, [0, 1], [layout.x, 0]);
          const rotate = interpolate(spotAmt, [0, 1], [layout.rotate, 0]);
          const lift = interpolate(spotAmt, [0, 1], [0, -28]);
          const spotScale = interpolate(spotAmt, [0, 1], [1, 1.12]);

          return (
            <div
              key={`${src}-${i}`}
              style={{
                position: "absolute",
                left: -CARD_SIZE / 2,
                top: -CARD_SIZE / 2,
                width: CARD_SIZE,
                height: CARD_SIZE,
                transform: `translate(${x}px, ${lift}px) rotate(${rotate}deg) scale(${enter * spotScale})`,
                borderRadius: 28,
                overflow: "hidden",
                background: "#0f172a",
                border: "5px solid #ffffff",
                boxShadow: isSpot
                  ? `0 30px 60px rgba(0,0,0,0.55), 0 0 0 3px ${s.accent}66`
                  : "0 16px 32px rgba(0,0,0,0.4)",
                zIndex: isSpot ? 10 : 1,
              }}
            >
              <Img
                src={staticFile(src)}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
