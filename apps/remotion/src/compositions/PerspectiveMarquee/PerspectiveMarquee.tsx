"use client";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";

export type PerspectiveMarqueeProps = {
  /** Comma-separated list of items to scroll. */
  items: string;
  /** Pixels advanced per frame. Recommended range 1–4. */
  speedPxPerFrame: number;
  /** Outer perspective in pixels. */
  perspective: number;
  rotateY: number;
  rotateX: number;
  fontSize: number;
  fontWeight: number;
  textTransform: "uppercase" | "none";
  clipStyle?: ClipStyle;
};

/**
 * A single horizontal row of large display type tilted into 3D space.
 * Items roll past a vanishing point with per-item depth-of-field blur,
 * matching the remocn.dev/docs/typography/perspective-marquee reference.
 */
export const PerspectiveMarquee: React.FC<PerspectiveMarqueeProps> = ({
  items,
  speedPxPerFrame,
  perspective,
  rotateY,
  rotateX,
  fontSize,
  fontWeight,
  textTransform,
  clipStyle,
}) => {
  const frame = useCurrentFrame();
  const s = resolveClipStyle(clipStyle, {
    background: "#050505",
    color: "#fafafa",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#fafafa",
  });

  const parsed = items
    .split(/[,\n]/)
    .map((t) => t.trim())
    .filter(Boolean);
  const baseItems = parsed.length > 0 ? parsed : ["Motion Studio"];

  // Repeat the list enough times to fill the row and survive a seamless loop.
  const cycle = baseItems.flatMap((_, i) =>
    Array.from({ length: 4 }, (__, k) => ({
      key: `${i}-${k}`,
      text: baseItems[i % baseItems.length]!,
    })),
  );

  const offset = (frame * speedPxPerFrame) % 1000;

  return (
    <AbsoluteFill
      style={{
        background: s.background,
        color: s.color,
        fontFamily: s.fontFamily,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: `${perspective}px`,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transformStyle: "preserve-3d",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: "1.2em",
            fontSize,
            fontWeight,
            letterSpacing: "-0.025em",
            textTransform,
            lineHeight: 1,
            position: "relative",
          }}
        >
          {cycle.map((item, i) => {
            // distance-from-center, in items — squared to make the edges
            // fall off faster than the center for stronger DOF feel.
            const totalSpan = cycle.length;
            const itemSlot =
              ((i + offset / (fontSize * 0.9)) % totalSpan) - totalSpan / 2;
            const norm = Math.min(1, Math.abs(itemSlot) / (totalSpan / 2));
            const eased = norm * norm;
            const blur = eased * 22;
            const opacity = 1 - eased * 0.92;
            return (
              <span
                key={item.key}
                style={{
                  display: "inline-block",
                  filter: `blur(${blur}px)`,
                  opacity,
                  transform: `translateX(${-offset}px)`,
                  willChange: "transform, opacity, filter",
                }}
              >
                {item.text}
              </span>
            );
          })}
        </div>
      </div>

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `linear-gradient(90deg, ${s.background} 0%, ${s.background}cc 12%, transparent 36%, transparent 64%, ${s.background}cc 88%, ${s.background} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
