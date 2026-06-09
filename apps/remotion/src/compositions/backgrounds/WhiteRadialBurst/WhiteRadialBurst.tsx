"use client";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../../clip-style";
import { useDesignFrame } from "../../../use-design-frame";

export type WhiteRadialBurstProps = {
  rayCount: number;
  clipStyle?: ClipStyle;
};

/**
 * Clean white field with thin blue lines radiating outward from the center.
 * Ray lengths and opacities vary by a deterministic function of their index
 * (no PRNG needed — the variation is a pure function of `i`), and the whole
 * burst rotates and breathes slowly so it stays crisp and geometric.
 */
export const WhiteRadialBurst: React.FC<WhiteRadialBurstProps> = ({
  rayCount,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const s = resolveClipStyle(clipStyle, {
    background: "#ffffff",
    color: "#0f1014",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#2563eb",
  });

  const cx = width / 2;
  const cy = height / 2;
  const maxLen = Math.hypot(width, height);
  const t = (frame / durationInFrames) * Math.PI * 2;
  const rotation = (frame * 0.04 * Math.PI) / 180;
  const breathe = 0.96 + 0.04 * Math.sin(t);

  const rays = Array.from({ length: rayCount }, (_, i) => {
    const angle = (i / rayCount) * Math.PI * 2 + rotation;
    const lenScale = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(i * 1.7));
    const len = maxLen * lenScale * breathe;
    return {
      x2: cx + Math.cos(angle) * len,
      y2: cy + Math.sin(angle) * len,
      opacity: 0.07 + 0.13 * (0.5 + 0.5 * Math.sin(i * 2.3)),
    };
  });

  return (
    <AbsoluteFill style={{ background: s.background }}>
      {/*
        SVG (not CSS gradients): the in-browser export composer ignores
        `radial-gradient`, so the center softening below is drawn as an SVG
        radial fill to survive the exported MP4.
      */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <radialGradient
            id="burst-core"
            gradientUnits="userSpaceOnUse"
            cx={cx}
            cy={cy}
            r={width * 0.22}
          >
            <stop offset="0%" stopColor={s.background} stopOpacity={1} />
            <stop offset="72%" stopColor={s.background} stopOpacity={0} />
          </radialGradient>
        </defs>
        {rays.map((r, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={r.x2}
            y2={r.y2}
            stroke={s.accent}
            strokeWidth={1.2}
            opacity={r.opacity}
          />
        ))}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="url(#burst-core)"
        />
      </svg>
    </AbsoluteFill>
  );
};
