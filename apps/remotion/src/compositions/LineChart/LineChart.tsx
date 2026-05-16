"use client";
import { AbsoluteFill } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { snap } from "../../snap";
import { useDesignFrame } from "../../use-design-frame";
import {
  CHART_PALETTE,
  chartReveal,
  niceMax,
  parseLabels,
  parseSeriesString,
} from "../_chart-shared";

export type LineChartProps = {
  title: string;
  caption: string;
  labels: string;
  values: string;
  showAxes: boolean;
  showGrid: boolean;
  showDots: boolean;
  clipStyle?: ClipStyle;
};

export const LineChart: React.FC<LineChartProps> = ({
  title,
  caption,
  labels,
  values,
  showAxes,
  showGrid,
  showDots,
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

  const points = data.map((v, i) => ({
    x: padX + i * stepX,
    y: padTop + innerH - (v / max) * innerH,
  }));

  const path = pathFromPoints(points);
  const drawProgress = chartReveal(frame, 18, 70);
  const headerProgress = chartReveal(frame, 0, 18);

  const muted = isHexLight(s.background)
    ? "rgba(15,16,20,0.55)"
    : "rgba(255,255,255,0.55)";
  const gridColor = isHexLight(s.background)
    ? "rgba(15,16,20,0.08)"
    : "rgba(255,255,255,0.08)";

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
      <div
        style={{
          marginBottom: 12,
          opacity: headerProgress,
          transform: `translate3d(0, ${snap((1 - headerProgress) * 8)}px, 0)`,
        }}
      >
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

          <path
            d={path}
            stroke={s.accent}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - drawProgress}
          />

          {showDots &&
            points.map((p, i) => {
              const dotAt = 18 + (i / Math.max(1, points.length - 1)) * 70;
              const reveal = chartReveal(frame, dotAt + 6, 12);
              return (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={8 * reveal}
                    fill={s.background}
                    stroke={s.accent}
                    strokeWidth={3}
                  />
                  {lbls[i] && (
                    <text
                      x={p.x}
                      y={padTop + innerH + 28}
                      fontSize={16}
                      fill={muted}
                      textAnchor="middle"
                    >
                      {lbls[i]}
                    </text>
                  )}
                </g>
              );
            })}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

function pathFromPoints(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const cp1x = prev.x + (curr.x - prev.x) / 3;
    const cp1y = prev.y;
    const cp2x = prev.x + ((curr.x - prev.x) * 2) / 3;
    const cp2y = curr.y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

function isHexLight(color: string): boolean {
  const c = color.trim().toLowerCase();
  if (c === "white" || c === "#fff" || c === "#ffffff") return true;
  if (c.startsWith("#") && c.length === 7) {
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
  }
  return false;
}
