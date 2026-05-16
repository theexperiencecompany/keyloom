"use client";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { snap } from "../../snap";
import { useDesignFrame } from "../../use-design-frame";

export type MetricCardProps = {
  value: number;
  prefix: string;
  suffix: string;
  label: string;
  sublabel: string;
  theme: "light" | "dark";
  clipStyle?: ClipStyle;
};

const D_CARD = 0;
const D_NUMBER = 8;
const COUNT_DURATION = 36;
const D_LABEL = 18;
const D_SUBLABEL = 26;
const COUNT_EASE = Easing.bezier(0.16, 1, 0.3, 1);

function formatNumber(n: number): string {
  const rounded = Math.round(n);
  return rounded.toLocaleString();
}

export const MetricCard: React.FC<MetricCardProps> = ({
  value,
  prefix,
  suffix,
  label,
  sublabel,
  theme,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();
  const isDark = theme === "dark";
  const s = resolveClipStyle(clipStyle, {
    background: "#f7f7f9",
    color: isDark ? "#ffffff" : "#0f1014",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#6366f1",
  });
  const accent = s.accent;
  const bg = s.background;
  const fontFamily = s.fontFamily;

  const cardBg = isDark ? "#15161A" : "#ffffff";
  const text = isDark ? "#ffffff" : "#0f1014";
  const muted = isDark ? "rgba(255,255,255,0.55)" : "rgba(15,16,20,0.55)";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,16,20,0.08)";

  const cardPop = spring({
    frame: frame - D_CARD,
    fps,
    config: { damping: 16, stiffness: 110, mass: 0.8 },
  });

  const countProgress = interpolate(
    frame,
    [D_NUMBER, D_NUMBER + COUNT_DURATION],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: COUNT_EASE,
    },
  );
  const animatedValue = value * countProgress;

  const numberPop = spring({
    frame: frame - D_NUMBER,
    fps,
    config: { damping: 13, stiffness: 160, mass: 0.6 },
  });

  return (
    <AbsoluteFill
      style={{
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
      }}
    >
      <div
        style={{
          width: 760,
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 32,
          padding: "60px 56px",
          textAlign: "center",
          backgroundImage: `radial-gradient(120% 80% at 50% 0%, ${accent}22, transparent 70%)`,
          boxShadow: isDark
            ? "0 30px 80px rgba(0,0,0,0.45)"
            : "0 30px 80px rgba(15,16,20,0.08)",
          opacity: cardPop,
          transform: `translate3d(0, ${snap((1 - cardPop) * 24)}px, 0) scale(${0.95 + cardPop * 0.05})`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            gap: 4,
            color: accent,
            fontSize: 132,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            opacity: numberPop,
            transform: `scale(${0.85 + numberPop * 0.15})`,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {prefix ? (
            <span style={{ fontSize: 80, fontWeight: 700 }}>{prefix}</span>
          ) : null}
          <span>{formatNumber(animatedValue)}</span>
          {suffix ? (
            <span style={{ fontSize: 80, fontWeight: 700 }}>{suffix}</span>
          ) : null}
        </div>

        <RevealItem frame={frame - D_LABEL} fps={fps}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              color: text,
              letterSpacing: "-0.01em",
              marginTop: 18,
            }}
          >
            {label}
          </div>
        </RevealItem>

        <RevealItem frame={frame - D_SUBLABEL} fps={fps}>
          <div
            style={{
              fontSize: 18,
              color: muted,
              fontWeight: 400,
              marginTop: 8,
              letterSpacing: "-0.005em",
            }}
          >
            {sublabel}
          </div>
        </RevealItem>
      </div>
    </AbsoluteFill>
  );
};

function RevealItem({
  frame,
  fps,
  children,
}: {
  frame: number;
  fps: number;
  children: React.ReactNode;
}) {
  const reveal = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 150, mass: 0.7 },
  });
  return (
    <div
      style={{
        opacity: reveal,
        transform: `translate3d(0, ${snap((1 - reveal) * 12)}px, 0)`,
      }}
    >
      {children}
    </div>
  );
}
