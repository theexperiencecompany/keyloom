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
    background: "#000000",
    color: "#ffffff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: CHART_PALETTE[0]!,
  });

  const data = parseSeriesString(values);
  const lbls = parseLabels(labels);
  const max = niceMax(Math.max(1, ...data));

  const titleProgress = chartReveal(frame, 0, 18);
  const captionProgress = chartReveal(frame, 8, 18);

  const W = 1640;
  const H = 700;
  const padX = 80;
  const padTop = 40;
  const padBottom = 80;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;
  const slot = innerW / Math.max(1, data.length);
  const barW = Math.min(120, slot * 0.6);

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
          opacity: titleProgress,
          transform: `translate3d(0, ${snap((1 - titleProgress) * 8)}px, 0)`,
        }}
      >
        <div
          style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.02em" }}
        >
          {title}
        </div>
        {caption && (
          <div
            style={{
              fontSize: 18,
              color: muted,
              marginTop: 4,
              opacity: captionProgress,
            }}
          >
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
            <>
              <line
                x1={padX}
                x2={W - padX}
                y1={padTop + innerH}
                y2={padTop + innerH}
                stroke={muted}
                strokeWidth={1}
              />
              {[0, 0.5, 1].map((t) => (
                <text
                  key={t}
                  x={padX - 14}
                  y={padTop + innerH * (1 - t)}
                  fontSize={14}
                  fill={muted}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {Math.round(max * t).toLocaleString()}
                </text>
              ))}
            </>
          )}

          {data.map((v, i) => {
            const start = 14 + i * 4;
            const grow = chartReveal(frame, start, 28);
            const barH = (v / max) * innerH * grow;
            const x = padX + slot * i + (slot - barW) / 2;
            const y = padTop + innerH - barH;
            const color = CHART_PALETTE[i % CHART_PALETTE.length]!;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={10}
                  ry={10}
                  fill={color}
                />
                {showValues && grow > 0.6 && (
                  <text
                    x={x + barW / 2}
                    y={y - 10}
                    fontSize={16}
                    fill={s.color}
                    fontWeight={600}
                    textAnchor="middle"
                    opacity={(grow - 0.6) / 0.4}
                  >
                    {v.toLocaleString()}
                  </text>
                )}
                {lbls[i] && (
                  <text
                    x={x + barW / 2}
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
