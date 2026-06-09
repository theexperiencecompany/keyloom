"use client";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../../clip-style";
import { useDesignFrame } from "../../../use-design-frame";

/**
 * Deterministic PRNG (mulberry32). We never call Math.random() because a
 * Remotion frame must render identically on every machine and on every
 * re-render — randomness would make the curved panels jitter and break
 * exports. mulberry32 is called ONCE at module level with a fixed seed to
 * precompute the static architectural panel geometry; the only per-frame
 * motion below is a pure function of the frame number (a slow light sweep
 * and faint parallax via sin/cos/interpolate).
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260609);

const PANEL_COUNT = 3;
/**
 * Each panel is a large sweeping curved surface. Control points are seeded
 * once so the architectural composition is stable; rendering scales them to
 * the actual frame dimensions at draw time.
 */
const PANELS = Array.from({ length: PANEL_COUNT }, (_, i) => ({
  // vertical anchor of the arc's apex, top-weighted for tall ceilings
  apexY: 0.12 + i * 0.28 + (rand() - 0.5) * 0.04,
  // how far the arc bows downward
  bow: 0.22 + rand() * 0.16,
  // horizontal skew of the apex, so arcs sweep diagonally
  skew: (rand() - 0.5) * 0.5,
  thickness: 0.16 + rand() * 0.1,
  parallax: 6 + i * 10,
  tint: i, // index into the light-blue gradient ramp
}));

export type FuturisticArchProps = {
  clipStyle?: ClipStyle;
};

export const FuturisticArch: React.FC<FuturisticArchProps> = ({
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const s = resolveClipStyle(clipStyle, {
    background: "#eaf1fb",
    color: "#0f1d33",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#5b9bff",
  });

  const tau = Math.PI * 2;
  const loop = (frame % durationInFrames) / durationInFrames;

  // slow light highlight sweeping left→right across the curves (loops)
  const lightX = interpolate(loop, [0, 1], [-0.25, 1.25]);
  // faint vertical parallax breathing
  const parallax = Math.sin(loop * tau) * 1;

  const panels = PANELS.map((p) => {
    const drift = parallax * p.parallax;
    const apexX = (0.5 + p.skew) * width;
    const apexY = p.apexY * height + drift;
    const bow = p.bow * height;
    const th = p.thickness * height;
    // top edge: a smooth cubic arc spanning the full width
    const topD =
      `M ${(-0.1 * width).toFixed(1)} ${(apexY + bow * 0.9).toFixed(1)} ` +
      `C ${(apexX - width * 0.35).toFixed(1)} ${(apexY - bow).toFixed(1)}, ` +
      `${(apexX + width * 0.35).toFixed(1)} ${(apexY - bow).toFixed(1)}, ` +
      `${(1.1 * width).toFixed(1)} ${(apexY + bow * 0.9).toFixed(1)}`;
    // closed surface: top arc, down the right, mirrored bottom arc, up the left
    const surfaceD =
      `M ${(-0.1 * width).toFixed(1)} ${(apexY + bow * 0.9).toFixed(1)} ` +
      `C ${(apexX - width * 0.35).toFixed(1)} ${(apexY - bow).toFixed(1)}, ` +
      `${(apexX + width * 0.35).toFixed(1)} ${(apexY - bow).toFixed(1)}, ` +
      `${(1.1 * width).toFixed(1)} ${(apexY + bow * 0.9).toFixed(1)} ` +
      `L ${(1.1 * width).toFixed(1)} ${(apexY + bow * 0.9 + th).toFixed(1)} ` +
      `C ${(apexX + width * 0.35).toFixed(1)} ${(apexY - bow + th).toFixed(1)}, ` +
      `${(apexX - width * 0.35).toFixed(1)} ${(apexY - bow + th).toFixed(1)}, ` +
      `${(-0.1 * width).toFixed(1)} ${(apexY + bow * 0.9 + th).toFixed(1)} Z`;
    return { ...p, topD, surfaceD };
  });

  return (
    <AbsoluteFill style={{ background: s.background, overflow: "hidden" }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <filter id="arch-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
          <filter id="arch-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          {panels.map((p, i) => {
            const ramp = ["#ffffff", "#f2f7ff", "#e4eefc"];
            const lo = ramp[p.tint % ramp.length]!;
            return (
              <linearGradient
                key={`grad-${i}`}
                id={`arch-grad-${i}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.98} />
                <stop offset="55%" stopColor={lo} stopOpacity={0.96} />
                <stop offset="100%" stopColor={s.accent} stopOpacity={0.22} />
              </linearGradient>
            );
          })}
          <linearGradient id="arch-light" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
            <stop offset="50%" stopColor="#ffffff" stopOpacity={0.85} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </linearGradient>
          <radialGradient
            id="arch-wash-a"
            gradientUnits="userSpaceOnUse"
            cx={width * 0.25}
            cy={height * 0.1}
            r={width * 0.8}
          >
            <stop offset="0%" stopColor={s.accent} stopOpacity={0.15} />
            <stop offset="55%" stopColor={s.accent} stopOpacity={0} />
          </radialGradient>
          <radialGradient
            id="arch-wash-b"
            gradientUnits="userSpaceOnUse"
            cx={width * 0.85}
            cy={height * 0.95}
            r={width * 0.85}
          >
            <stop offset="0%" stopColor={s.accent} stopOpacity={0.12} />
            <stop offset="60%" stopColor={s.accent} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="arch-base" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor={s.background} />
            <stop offset="100%" stopColor="#dde8f7" />
          </linearGradient>
        </defs>

        {/* ambient base + soft blue washes (SVG so the export composer keeps them) */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="url(#arch-base)"
        />
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="url(#arch-wash-a)"
        />
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="url(#arch-wash-b)"
        />

        {panels.map((p, i) => (
          <g key={`panel-${i}`}>
            {/* soft cast shadow beneath the surface */}
            <path
              d={p.surfaceD}
              fill={s.accent}
              opacity={0.1}
              transform={`translate(0 ${18 + i * 4})`}
              filter="url(#arch-shadow)"
            />
            {/* the curved white surface */}
            <path
              d={p.surfaceD}
              fill={`url(#arch-grad-${i})`}
              filter="url(#arch-soft)"
            />
            {/* crisp highlight edge along the top of the arc */}
            <path
              d={p.topD}
              fill="none"
              stroke="#ffffff"
              strokeWidth={2.5}
              opacity={0.7}
            />
          </g>
        ))}

        {/* moving light highlight crossing the curves */}
        <rect
          x={(lightX - 0.18) * width}
          y={-height * 0.1}
          width={width * 0.36}
          height={height * 1.2}
          fill="url(#arch-light)"
          opacity={0.18}
          transform={`rotate(-12 ${lightX * width} ${height / 2})`}
        />
      </svg>

      {/* gentle top sheen for clean studio lighting */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 28%)",
        }}
      />
    </AbsoluteFill>
  );
};
