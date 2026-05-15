"use client";
import { AbsoluteFill } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { useDesignFrame } from "../../use-design-frame";
import { CHART_PALETTE, chartReveal } from "../_chart-shared";

export type RadialChartProps = {
  title: string;
  caption: string;
  label: string;
  value: number;
  max: number;
  unit: string;
  clipStyle?: ClipStyle;
};

export const RadialChart: React.FC<RadialChartProps> = ({
  title,
  caption,
  label,
  value,
  max,
  unit,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const s = resolveClipStyle(clipStyle, {
    background: "#000000",
    color: "#ffffff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: CHART_PALETTE[0]!,
  });

  const headerProgress = chartReveal(frame, 0, 18);
  const arcProgress = chartReveal(frame, 16, 90);
  const ratio = Math.max(0, Math.min(1, value / Math.max(1, max)));

  const r = 220;
  const stroke = 36;
  const circumference = 2 * Math.PI * r;
  const targetDash = circumference * ratio;
  const dash = targetDash * arcProgress;

  const counter = Math.round(value * arcProgress);
  const muted = "rgba(255,255,255,0.55)";

  return (
    <AbsoluteFill
      style={{
        background: s.background,
        color: s.color,
        fontFamily: s.fontFamily,
        padding: 96,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ opacity: headerProgress, marginBottom: 12 }}>
        <div
          style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.02em" }}
        >
          {title}
        </div>
        {caption && (
          <div style={{ fontSize: 18, color: muted, marginTop: 4 }}>
            {caption}
          </div>
        )}
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg viewBox="-300 -300 600 600" style={{ height: "100%" }}>
          <circle
            cx={0}
            cy={0}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
          />
          <circle
            cx={0}
            cy={0}
            r={r}
            fill="none"
            stroke={s.accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            transform="rotate(-90)"
          />
          <text
            x={0}
            y={-4}
            fontSize={104}
            fontWeight={700}
            letterSpacing="-0.04em"
            fill={s.color}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {counter.toLocaleString()}
            {unit}
          </text>
          <text
            x={0}
            y={60}
            fontSize={22}
            fontWeight={500}
            fill={muted}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {label}
          </text>
        </svg>
      </div>
    </AbsoluteFill>
  );
};
