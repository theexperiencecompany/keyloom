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

export type AreaChartProps = {
  title: string;
  caption: string;
  labels: string;
  values: string;
  showAxes: boolean;
  showGrid: boolean;
  clipStyle?: ClipStyle;
};

export const AreaChart: React.FC<AreaChartProps> = ({
  title,
  caption,
  labels,
  values,
  showAxes,
  showGrid,
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
  const max = niceMax(Math.max(1, ...data));

  const W = 1640;
  const H = 700;
  const padX = 80;
  const padTop = 40;
  const padBottom = 80;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;
  const stepX = innerW / Math.max(1, data.length - 1);

  const reveal = chartReveal(frame, 16, 60);
  const points = data.map((v, i) => ({
    x: padX + i * stepX,
    y: padTop + innerH - (v / max) * innerH * reveal,
  }));

  const headerProgress = chartReveal(frame, 0, 18);
  const linePath = smoothPath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaPath =
    lastPoint && firstPoint
      ? `${linePath} L ${lastPoint.x} ${padTop + innerH} L ${firstPoint.x} ${padTop + innerH} Z`
      : "";

  const muted = "rgba(255,255,255,0.55)";
  const gridColor = "rgba(255,255,255,0.08)";
  const gradId = "area-grad";

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
      <div style={{ marginBottom: 12, opacity: headerProgress }}>
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
      <div style={{ flex: 1, minHeight: 0 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "100%" }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.accent} stopOpacity={0.55} />
              <stop offset="100%" stopColor={s.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showGrid &&
            [0.25, 0.5, 0.75, 1].map((t) => (
              <line
                key={t}
                x1={padX}
                x2={W - padX}
                y1={padTop + innerH * (1 - t)}
                y2={padTop + innerH * (1 - t)}
                stroke={gridColor}
                strokeWidth={1}
                strokeDasharray="4 6"
              />
            ))}
          {showAxes && (
            <line
              x1={padX}
              x2={W - padX}
              y1={padTop + innerH}
              y2={padTop + innerH}
              stroke={muted}
              strokeWidth={1}
            />
          )}
          <path d={areaPath} fill={`url(#${gradId})`} />
          <path
            d={linePath}
            stroke={s.accent}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
          {lbls.map((label, i) => {
            const p = points[i];
            if (!p) return null;
            return (
              <text
                key={i}
                x={p.x}
                y={padTop + innerH + 28}
                fontSize={16}
                fill={muted}
                textAnchor="middle"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const cp1x = prev.x + (curr.x - prev.x) / 3;
    const cp2x = prev.x + ((curr.x - prev.x) * 2) / 3;
    d += ` C ${cp1x} ${prev.y}, ${cp2x} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}
