"use client";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";

export type PerspectiveMarqueeProps = {
  text: string;
  rows: number;
  speed: number;
  perspective: number;
  rotateX: number;
  fontSize: number;
  fontWeight: number;
  textTransform: "uppercase" | "none";
  clipStyle?: ClipStyle;
};

export const PerspectiveMarquee: React.FC<PerspectiveMarqueeProps> = ({
  text,
  rows,
  speed,
  perspective,
  rotateX,
  fontSize,
  fontWeight,
  textTransform,
  clipStyle,
}) => {
  const frame = useCurrentFrame();
  const s = resolveClipStyle(clipStyle, {
    background: "#0a0a0e",
    color: "#ffffff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#6366f1",
  });

  const safeRows = Math.max(1, Math.min(8, Math.round(rows)));
  const safeText = text.trim() ? text : "MOTION STUDIO";
  const repeated = Array.from({ length: 8 }, () => safeText).join(" • ");

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
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotateX}deg)`,
          width: "240%",
        }}
      >
        {Array.from({ length: safeRows }).map((_, row) => {
          const direction = row % 2 === 0 ? 1 : -1;
          const offset = (frame * speed * direction) % 800;
          const rowOpacity = interpolate(row, [0, safeRows - 1], [0.35, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={row}
              style={{
                position: "relative",
                whiteSpace: "nowrap",
                overflow: "hidden",
                marginBottom: 16,
                opacity: rowOpacity,
              }}
            >
              <div
                style={{
                  transform: `translateX(${-offset}px)`,
                  display: "flex",
                  gap: "0.4em",
                  fontSize,
                  fontWeight,
                  textTransform,
                  letterSpacing: "-0.025em",
                  lineHeight: 1,
                  color: row === Math.floor(safeRows / 2) ? s.accent : s.color,
                }}
              >
                <span>{repeated}</span>
                <span>{repeated}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse at center, transparent 35%, ${s.background} 75%)`,
        }}
      />
    </AbsoluteFill>
  );
};
