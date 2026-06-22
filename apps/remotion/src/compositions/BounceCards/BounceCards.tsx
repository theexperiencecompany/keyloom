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
import { useCanvasLayout } from "../../use-canvas-layout";

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
// drive them with Remotion's frame-based spring instead of GSAP. `x` is the
// horizontal offset as a multiple of the card size, so the fan stays
// proportional as the card scales with the canvas.
type CardLayout = { rotate: number; x: number };

const LAYOUT: CardLayout[] = [
  { rotate: 10, x: -1.417 },
  { rotate: 5, x: -0.708 },
  { rotate: -3, x: 0 },
  { rotate: -10, x: 0.708 },
  { rotate: 2, x: 1.417 },
];

const STAGGER_FRAMES = 4; // ~0.13s between each card popping in

export const BounceCards: React.FC<BounceCardsProps> = ({
  images,
  clipStyle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { vw, vh, vmin } = useCanvasLayout();
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

  // The fan spans ~2.83 card widths of horizontal offset plus one card width,
  // so cap the card size so the whole fan fits the canvas in any aspect ratio.
  const cardSize = Math.min(vw(22), vh(40));
  const borderW = vmin(0.7);
  const radius = vmin(3.9);
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
                left: -cardSize / 2,
                top: -cardSize / 2,
                width: cardSize,
                height: cardSize,
                transform: `translate(${layout.x * cardSize}px, 0px) rotate(${layout.rotate}deg) scale(${enter})`,
                borderRadius: radius,
                overflow: "hidden",
                background: "#0f172a",
                border: `${borderW}px solid #ffffff`,
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
