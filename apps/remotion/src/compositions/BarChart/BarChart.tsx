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
} from "../charts-shared";

export type BarChartProps = {
  title: string;
  caption: string;
  labels: string;
  values: string;
  showAxes: boolean;
  showGrid: boolean;
  showValues: boolean;
  clipStyle?: ClipStyle;
};

const GRID_FRACTIONS = [0.25, 0.5, 0.75, 1];
const TICK_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];

export const BarChart: React.FC<BarChartProps> = ({
  title,
  caption,
  labels,
  values,
  showAxes,
  showGrid,
  showValues,
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

  const data = parseSeriesString(values);
  const lbls = parseLabels(labels).slice(0, data.length);
  const max = niceMax(Math.max(1, ...data));

  const W = 1640;
  const H = 640;
  const padLeft = 96;
  const padRight = 48;
  const padTop = 44;
  const padBottom = 56;
  const innerW = W - padLeft - padRight;
  const innerH = H - padTop - padBottom;
  const baselineY = padTop + innerH;
  const slot = innerW / Math.max(1, data.length);
  const barW = Math.min(110, slot * 0.58);

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
      <div style={{ marginBottom: 32 }}>
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

      <div style={{ flex: 1, minHeight: 0 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "100%" }}
        >
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

          {data.map((v, i) => {
            const grow = chartReveal(frame, 8 + i * 4, 34);
            const barH = (v / max) * innerH * grow;
            const x = padLeft + slot * i + (slot - barW) / 2;
            const y = baselineY - barH;
            const ramp = data.length > 1 ? i / (data.length - 1) : 1;
            return (
              <g key={i}>
                <path
                  d={roundedTopBar(x, y, barW, barH, 8)}
                  fill={s.accent}
                  fillOpacity={0.45 + 0.55 * ramp}
                />
                {showValues && grow > 0.7 && (
                  <text
                    x={x + barW / 2}
                    y={y - 14}
                    fontSize={17}
                    fontWeight={600}
                    fill={s.color}
                    textAnchor="middle"
                    opacity={(grow - 0.7) / 0.3}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {v.toLocaleString()}
                  </text>
                )}
              </g>
            );
          })}

          {lbls.map((label, i) => (
            <text
              key={i}
              x={padLeft + slot * i + slot / 2}
              y={baselineY + 34}
              fontSize={16}
              fill={s.color}
              fillOpacity={0.6}
              textAnchor="middle"
            >
              {label}
            </text>
          ))}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

function roundedTopBar(
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
): string {
  if (h <= 0) return "";
  const r = Math.min(radius, h, w / 2);
  return `M ${x} ${y + h} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + h} Z`;
}
