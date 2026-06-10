"use client";
import {
  AbsoluteFill,
  Img,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";

/**
 * Shape the `imageList` field editor reads/writes: an array of `{ name, url }`
 * (NOT plain strings). `url` is either a static path under public/ or an
 * uploaded/pasted data:/http URL.
 */
export type BounceCardImage = { name: string; url: string };

export type BounceCardsProps = {
  images: BounceCardImage[];
  clipStyle?: ClipStyle;
};

/** Resolve a card URL: static paths go through staticFile, URLs pass through. */
function resolveSrc(url: string): string {
  return /^(https?:|data:|blob:)/.test(url) ? url : staticFile(url);
}

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

  // The imageList editor can hand us empty/blank slots; drop anything without
  // a usable url so staticFile() never sees undefined.
  const validImages = (Array.isArray(images) ? images : []).filter(
    (item): item is BounceCardImage => Boolean(item?.url),
  );
  return (
    <AbsoluteFill
      style={{
        background: s.background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "relative", width: 0, height: 0 }}>
        {validImages.map((item, i) => {
          const layout = LAYOUT[i % LAYOUT.length] ?? { rotate: 0, x: 0 };

          // Elastic bounce-in: each card springs scale 0 → 1, staggered.
          // Low damping gives the overshoot/settle of `elastic.out`. Once it
          // settles the card holds its fan position — no further motion.
          const enter = spring({
            frame: frame - i * STAGGER_FRAMES,
            fps,
            config: { damping: 9, mass: 0.8, stiffness: 120 },
          });

          return (
            <div
              key={`${item.url}-${i}`}
              style={{
                position: "absolute",
                left: -CARD_SIZE / 2,
                top: -CARD_SIZE / 2,
                width: CARD_SIZE,
                height: CARD_SIZE,
                transform: `translate(${layout.x}px, 0px) rotate(${layout.rotate}deg) scale(${enter})`,
                borderRadius: 28,
                overflow: "hidden",
                background: "#0f172a",
                border: "5px solid #ffffff",
                boxShadow: "0 16px 32px rgba(0,0,0,0.4)",
              }}
            >
              <Img
                src={resolveSrc(item.url)}
                alt={item.name}
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
