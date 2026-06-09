"use client";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../../clip-style";
import { useDesignFrame } from "../../../use-design-frame";

export type BlueGridProps = {
  cellSize: number;
  clipStyle?: ClipStyle;
};

/**
 * Vivid cobalt-blue field with a faint square grid and a soft white highlight
 * glow in the corner. The grid drifts slowly and the glow breathes.
 *
 * Drawn with SVG (not CSS gradients) on purpose: the in-browser export's DOM
 * composer only rasterizes `linear-gradient` and ignores `radial-gradient` and
 * `background-size` tiling, so a CSS version renders as a black frame in the
 * exported MP4. SVG `<rect>`/`<line>` and SVG gradients composite correctly in
 * both the Player and the export.
 */
export const BlueGrid: React.FC<BlueGridProps> = ({ cellSize, clipStyle }) => {
  const frame = useDesignFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const s = resolveClipStyle(clipStyle, {
    background: "#1d4ed8",
    color: "#ffffff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#3b82f6",
  });

  const offset = (frame * 0.12) % cellSize;
  const t = (frame / durationInFrames) * Math.PI * 2;
  const glowX = (0.82 + (Math.sin(t) * 3) / 100) * width;
  const glowY = (0.14 + (Math.cos(t) * 3) / 100) * height;
  const glowAlpha = 0.4 + 0.12 * Math.sin(t);

  const verticals: number[] = [];
  for (let x = offset - cellSize; x <= width + cellSize; x += cellSize) {
    verticals.push(x);
  }
  const horizontals: number[] = [];
  for (let y = offset - cellSize; y <= height + cellSize; y += cellSize) {
    horizontals.push(y);
  }

  return (
    <AbsoluteFill style={{ background: s.background }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <radialGradient
            id="bluegrid-field"
            gradientUnits="userSpaceOnUse"
            cx={width / 2}
            cy={height * 1.25}
            r={width * 0.7}
          >
            <stop offset="0%" stopColor="#0a2a8a" />
            <stop offset="70%" stopColor={s.background} />
            <stop offset="100%" stopColor={s.background} />
          </radialGradient>
          <radialGradient
            id="bluegrid-glow"
            gradientUnits="userSpaceOnUse"
            cx={glowX}
            cy={glowY}
            r={width * 0.4}
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity={glowAlpha} />
            <stop offset="45%" stopColor="#ffffff" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </radialGradient>
        </defs>

        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="url(#bluegrid-field)"
        />

        <g stroke="#ffffff" strokeOpacity={0.1} strokeWidth={1}>
          {verticals.map((x, i) => (
            <line key={`v-${i}`} x1={x} y1={0} x2={x} y2={height} />
          ))}
          {horizontals.map((y, i) => (
            <line key={`h-${i}`} x1={0} y1={y} x2={width} y2={y} />
          ))}
        </g>

        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="url(#bluegrid-glow)"
        />
      </svg>
    </AbsoluteFill>
  );
};
