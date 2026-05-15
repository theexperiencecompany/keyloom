"use client";
import { AbsoluteFill } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { useDesignFrame } from "../../use-design-frame";
import {
  CHART_PALETTE,
  chartReveal,
  niceMax,
  parseLabels,
  parseSeriesString,
} from "../_chart-shared";

export type RadarChartProps = {
  title: string;
  caption: string;
  labels: string;
  values: string;
  clipStyle?: ClipStyle;
};

export const RadarChart: React.FC<RadarChartProps> = ({
  title,
  caption,
  labels,
  values,
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

  const data = parseSeriesString(values);
  const lbls = parseLabels(labels);
  const n = Math.max(3, data.length);
  const max = niceMax(Math.max(1, ...data));

  const radius = 230;
  const reveal = chartReveal(frame, 18, 80);
  const headerProgress = chartReveal(frame, 0, 18);

  const angleFor = (i: number) => -Math.PI / 2 + (i / n) * Math.PI * 2;

  const points = data.map((v, i) => {
    const r = (v / max) * radius * reveal;
    const a = angleFor(i);
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  });

  const rings = [0.25, 0.5, 0.75, 1];
  const muted = "rgba(255,255,255,0.55)";
  const grid = "rgba(255,255,255,0.16)";

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
        <svg viewBox="-340 -300 680 600" style={{ height: "100%" }}>
          {rings.map((r) => (
            <polygon
              key={r}
              fill="none"
              stroke={grid}
              strokeWidth={1}
              points={Array.from({ length: n }, (_, i) => {
                const a = angleFor(i);
                return `${Math.cos(a) * radius * r},${Math.sin(a) * radius * r}`;
              }).join(" ")}
            />
          ))}
          {Array.from({ length: n }).map((_, i) => {
            const a = angleFor(i);
            return (
              <line
                key={i}
                x1={0}
                y1={0}
                x2={Math.cos(a) * radius}
                y2={Math.sin(a) * radius}
                stroke={grid}
                strokeWidth={1}
              />
            );
          })}
          <polygon
            points={points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill={s.accent}
            fillOpacity={0.28}
            stroke={s.accent}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={6} fill={s.accent} />
          ))}
          {Array.from({ length: n }).map((_, i) => {
            const a = angleFor(i);
            const lx = Math.cos(a) * (radius + 32);
            const ly = Math.sin(a) * (radius + 32);
            return (
              <text
                key={i}
                x={lx}
                y={ly}
                fontSize={16}
                fill={muted}
                textAnchor={lx > 5 ? "start" : lx < -5 ? "end" : "middle"}
                dominantBaseline="middle"
              >
                {lbls[i] ?? `Axis ${i + 1}`}
              </text>
            );
          })}
        </svg>
      </div>
    </AbsoluteFill>
  );
};
