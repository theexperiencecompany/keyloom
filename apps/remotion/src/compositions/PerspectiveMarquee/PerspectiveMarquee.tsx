"use client";
import { AbsoluteFill } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { snap } from "../../snap";
import { useDesignFrame } from "../../use-design-frame";

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
  const frame = useDesignFrame();
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

  // Estimate width per item so we can build a seamless loop without DOM measurement.
  const gapPx = Math.max(1, fontSize * 1.2);
  const widths = baseItems.map(
    (t) => Math.max(1, t.length * fontSize * 0.58) + gapPx,
  );
  const cycleWidth = Math.max(
    1,
    widths.reduce((a, b) => a + b, 0),
  );

  // Repeat the full word list (not each word) to fill the screen and allow wrap.
  const copies = 4;
  const cycle = Array.from({ length: copies }).flatMap((_, c) =>
    baseItems.map((text, i) => ({ key: `${c}-${i}`, text, idx: i })),
  );

  // Pre-compute each item's left position within the long row.
  const positions: number[] = [];
  let running = 0;
  for (let c = 0; c < copies; c++) {
    for (let i = 0; i < baseItems.length; i++) {
      positions.push(running);
      running += widths[i]!;
    }
  }

  const offset = (frame * speedPxPerFrame) % cycleWidth;
  const totalWidth = cycleWidth * copies;

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
            fontSize,
            fontWeight,
            letterSpacing: "-0.025em",
            textTransform,
            lineHeight: 1,
            position: "relative",
            width: totalWidth,
            height: fontSize * 1.4,
          }}
        >
          {cycle.map((item, i) => {
            const rawX = positions[i]! - offset;
            const wrapped = ((rawX % totalWidth) + totalWidth) % totalWidth;
            return (
              <span
                key={item.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  transform: `translate3d(${snap(wrapped)}px, 0, 0)`,
                  display: "inline-block",
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
