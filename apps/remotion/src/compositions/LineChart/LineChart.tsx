"use client";
import { useId } from "react";
import { AbsoluteFill } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { useDesignFrame } from "../../use-design-frame";
import {
  CHART_PALETTE,
  chartReveal,
  niceMax,
  parseLabels,
  parseSeriesString,
} from "../charts-shared";

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

const GRID_FRACTIONS = [0.25, 0.5, 0.75, 1];
const TICK_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];

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
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const gradientId = `line-grad-${uid}`;
  const clipId = `line-clip-${uid}`;
  const s = resolveClipStyle(clipStyle, {
    background: "#0b0c10",
    color: "#ffffff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: CHART_PALETTE[0]!,
  });

  const data = parseSeriesString(values);
  const lbls = parseLabels(labels).slice(0, data.length);
  const max = niceMax(Math.max(1, ...data));
  const latest = data[data.length - 1] ?? 0;
  const latestLabel = lbls[data.length - 1];

  const W = 1640;
  const H = 620;
  const padLeft = 96;
  const padRight = 48;
  const padTop = 28;
  const padBottom = 56;
  const innerW = W - padLeft - padRight;
  const innerH = H - padTop - padBottom;
  const baselineY = padTop + innerH;
  const stepX = innerW / Math.max(1, data.length - 1);

  const points = data.map((v, i) => ({
    x: padLeft + i * stepX,
    y: baselineY - (v / max) * innerH,
  }));
  const linePath = smoothPath(points);
  const firstPoint = points[0];
  const endpoint = points[points.length - 1];
  const areaPath =
    firstPoint && endpoint
      ? `${linePath} L ${endpoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`
      : "";

  const drawProgress = chartReveal(frame, 8, 64);
  const revealX = padLeft + innerW * drawProgress;
  const endpointReveal = chartReveal(frame, 64, 14);
  const counter = Math.round(latest * drawProgress);

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 32,
        }}
      >
        <div>
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
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 56,
              fontWeight: 650,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {counter.toLocaleString()}
          </div>
          {latestLabel && (
            <div style={{ fontSize: 16, marginTop: 8, opacity: 0.4 }}>
              {latestLabel}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "100%" }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.accent} stopOpacity={0.25} />
              <stop offset="100%" stopColor={s.accent} stopOpacity={0} />
            </linearGradient>
            <clipPath id={clipId}>
              <rect x={0} y={0} width={revealX + 6} height={H} />
            </clipPath>
          </defs>

          {showGrid &&
            GRID_FRACTIONS.map((t) => (
              <line
                key={t}
                x1={padLeft}
                x2={W - padRight}
                y1={padTop + innerH * (1 - t)}
                y2={padTop + innerH * (1 - t)}
                stroke={s.color}
                strokeOpacity={0.08}
                strokeWidth={1}
              />
            ))}

          {showAxes && (
            <>
              <line
                x1={padLeft}
                x2={W - padRight}
                y1={baselineY}
                y2={baselineY}
                stroke={s.color}
                strokeOpacity={0.15}
                strokeWidth={1}
              />
              {TICK_FRACTIONS.map((t) => (
                <text
                  key={t}
                  x={padLeft - 18}
                  y={padTop + innerH * (1 - t)}
                  fontSize={15}
                  fill={s.color}
                  fillOpacity={0.45}
                  textAnchor="end"
                  dominantBaseline="middle"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {Math.round(max * t).toLocaleString()}
                </text>
              ))}
            </>
          )}

          <g clipPath={`url(#${clipId})`}>
            <path d={areaPath} fill={`url(#${gradientId})`} />
            <path
              d={linePath}
              stroke={s.accent}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {showDots &&
            points.slice(0, -1).map((p, i) => {
              const dotAt = 8 + (i / Math.max(1, points.length - 1)) * 64;
              const reveal = chartReveal(frame, dotAt, 10);
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={5.5 * reveal}
                  fill={s.background}
                  stroke={s.accent}
                  strokeWidth={2.5}
                />
              );
            })}

          {endpoint && (
            <g opacity={endpointReveal}>
              <circle
                cx={endpoint.x}
                cy={endpoint.y}
                r={22}
                fill={s.accent}
                fillOpacity={0.15}
              />
              <circle cx={endpoint.x} cy={endpoint.y} r={7} fill={s.accent} />
            </g>
          )}

          {lbls.map((label, i) => {
            const p = points[i];
            if (!p) return null;
            return (
              <text
                key={i}
                x={p.x}
                y={baselineY + 34}
                fontSize={16}
                fill={s.color}
                fillOpacity={0.6}
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
