"use client";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../../clip-style";
import { useDesignFrame } from "../../../use-design-frame";

/**
 * Deterministic PRNG (mulberry32). Math.random() is forbidden in a Remotion
 * frame because every render of a given frame must be byte-identical — random
 * jitter would flicker on scrub and break server exports. mulberry32 runs ONCE
 * at module level with a fixed seed to precompute the specular streak offsets;
 * all per-frame motion is a pure function of the frame number.
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

const STREAKS = Array.from({ length: 2 }, () => ({
  phase: rand() * Math.PI * 2,
  speedCycles: 1 + Math.round(rand()),
  tilt: -18 + rand() * 36,
  widthFrac: 0.06 + rand() * 0.05,
  opacity: 0.18 + rand() * 0.14,
}));

export type LiquidChromeProps = {
  clipStyle?: ClipStyle;
};

export const LiquidChrome: React.FC<LiquidChromeProps> = ({ clipStyle }) => {
  const frame = useDesignFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const s = resolveClipStyle(clipStyle, {
    background: "#0a0f1c",
    color: "#ffffff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#60a5fa",
  });

  const tau = Math.PI * 2;
  const loop = (frame % durationInFrames) / durationInFrames;

  // Turbulence baseFrequency breathes smoothly across the loop so the chrome
  // surface flows without a visible seam at the loop boundary.
  const fx = 0.004 + Math.sin(loop * tau) * 0.0015;
  const fy = 0.0055 + Math.cos(loop * tau) * 0.0015;
  // Displacement scale gently pulses the liquid distortion.
  const dispScale = 70 + Math.sin(loop * tau + 1) * 22;
  // Slide the metallic gradient so highlights travel across the surface.
  const gradShift = Math.sin(loop * tau) * 12;

  return (
    <AbsoluteFill style={{ background: s.background, overflow: "hidden" }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <linearGradient
            id="chrome-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
            gradientTransform={`rotate(${gradShift} 0.5 0.5)`}
          >
            <stop offset="0%" stopColor="#e5e7eb" />
            <stop offset="22%" stopColor="#ffffff" />
            <stop offset="42%" stopColor="#94a3b8" />
            <stop offset="58%" stopColor={s.accent} />
            <stop offset="74%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          <filter id="liquid" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="turbulence"
              baseFrequency={`${fx.toFixed(5)} ${fy.toFixed(5)}`}
              numOctaves={4}
              seed={7}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={dispScale.toFixed(1)}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <radialGradient id="chrome-vignette" cx="50%" cy="40%" r="75%">
            <stop offset="0%" stopColor="#000000" stopOpacity={0} />
            <stop offset="100%" stopColor="#000000" stopOpacity={0.45} />
          </radialGradient>
        </defs>

        {/* metallic surface distorted into liquid chrome */}
        <g filter="url(#liquid)">
          <rect
            x={-width * 0.1}
            y={-height * 0.1}
            width={width * 1.2}
            height={height * 1.2}
            fill="url(#chrome-grad)"
          />
        </g>

        {/* low-opacity blue accent wash to tint the silver toward cool chrome */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={s.accent}
          opacity={0.1}
          style={{ mixBlendMode: "soft-light" }}
        />

        {/* sliding specular highlight streaks */}
        {STREAKS.map((st, i) => {
          const x = interpolate(
            (loop * st.speedCycles + st.phase / tau) % 1,
            [0, 1],
            [-width * 0.3, width * 1.1],
          );
          const w = width * st.widthFrac;
          const shimmer =
            st.opacity * (0.6 + 0.4 * Math.sin(loop * tau * 2 + st.phase));
          return (
            <rect
              key={`streak-${i}`}
              x={x}
              y={-height * 0.3}
              width={w}
              height={height * 1.6}
              fill="#ffffff"
              opacity={shimmer.toFixed(3)}
              transform={`rotate(${st.tilt.toFixed(1)} ${x + w / 2} ${height / 2})`}
              style={{ mixBlendMode: "screen", filter: "blur(18px)" }}
            />
          );
        })}

        {/* soft studio vignette */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="url(#chrome-vignette)"
        />
      </svg>
    </AbsoluteFill>
  );
};
