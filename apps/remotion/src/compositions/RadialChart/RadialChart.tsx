"use client";
import { AbsoluteFill } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { useDesignFrame } from "../../use-design-frame";
import { CHART_PALETTE, chartReveal } from "../charts-shared";

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
    background: "#0b0c10",
    color: "#ffffff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: CHART_PALETTE[0]!,
  });

  const arcProgress = chartReveal(frame, 8, 84);
  const ratio = Math.max(0, Math.min(1, value / Math.max(1, max)));

  const r = 225;
  const stroke = 30;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * ratio * arcProgress;

  const counter = Math.round(value * arcProgress);
  const valueText = `${counter.toLocaleString()}${unit}`;
  const finalLength = `${Math.round(value).toLocaleString()}${unit}`.length;
  const valueFontSize = Math.min(150, 620 / Math.max(3, finalLength));

  return (
    <AbsoluteFill
      style={{
        background: s.background,
        color: s.color,
        fontFamily: s.fontFamily,
        padding: "96px 128px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <div
          style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.01em" }}
        >
          {title}
        </div>
        {caption && (
          <div style={{ fontSize: 19, marginTop: 6, opacity: 0.6 }}>
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
            stroke={s.color}
            strokeOpacity={0.12}
            strokeWidth={stroke}
          />
          {dash > 0 && (
            <g transform="rotate(-90)">
              <circle
                cx={0}
                cy={0}
                r={r}
                fill="none"
                stroke={s.accent}
                strokeOpacity={0.14}
                strokeWidth={stroke + 22}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
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
              />
            </g>
          )}
          <text
            x={0}
            y={-18}
            fontSize={valueFontSize}
            fontWeight={700}
            letterSpacing="-0.03em"
            fill={s.color}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {valueText}
          </text>
          <text
            x={0}
            y={valueFontSize * 0.5 + 20}
            fontSize={24}
            fontWeight={500}
            fill={s.color}
            fillOpacity={0.4}
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
