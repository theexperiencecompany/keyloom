"use client";
import { AbsoluteFill } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { useDesignFrame } from "../../use-design-frame";
import {
  CHART_PALETTE,
  chartReveal,
  parseLabels,
  parseSeriesString,
} from "../_chart-shared";

export type PieChartProps = {
  title: string;
  caption: string;
  labels: string;
  values: string;
  donut: boolean;
  showLegend: boolean;
  clipStyle?: ClipStyle;
};

export const PieChart: React.FC<PieChartProps> = ({
  title,
  caption,
  labels,
  values,
  donut,
  showLegend,
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
  const total = data.reduce((a, b) => a + b, 0) || 1;

  const headerProgress = chartReveal(frame, 0, 18);
  const wheelProgress = chartReveal(frame, 18, 80);

  const cx = 0;
  const cy = 0;
  const rOuter = 230;
  const rInner = donut ? 130 : 0;

  let cursor = -Math.PI / 2;
  const slices = data.map((v, i) => {
    const angle = (v / total) * Math.PI * 2;
    const sliceProgress = chartReveal(
      frame,
      18 + (i / Math.max(1, data.length)) * 60,
      24,
    );
    const visibleAngle =
      angle * Math.min(wheelProgress, sliceProgress + 0.0001);
    const start = cursor;
    const end = cursor + visibleAngle;
    cursor += angle;
    return {
      start,
      end,
      angle,
      color: CHART_PALETTE[i % CHART_PALETTE.length]!,
      value: v,
      pct: v / total,
    };
  });

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
      <div style={{ opacity: headerProgress, marginBottom: 28 }}>
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
          gap: 80,
        }}
      >
        <svg viewBox="-280 -280 560 560" style={{ height: "100%" }}>
          {slices.map((slice, i) => (
            <path
              key={i}
              d={arcPath(cx, cy, rInner, rOuter, slice.start, slice.end)}
              fill={slice.color}
            />
          ))}
          {donut && (
            <text
              x={0}
              y={6}
              fontSize={56}
              fontWeight={700}
              fill={s.color}
              textAnchor="middle"
              opacity={wheelProgress}
            >
              {total.toLocaleString()}
            </text>
          )}
        </svg>
        {showLegend && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              opacity: headerProgress,
            }}
          >
            {slices.map((slice, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    background: slice.color,
                  }}
                />
                <span style={{ fontSize: 20, fontWeight: 500 }}>
                  {lbls[i] ?? `Series ${i + 1}`}
                </span>
                <span style={{ fontSize: 18, color: muted, marginLeft: 8 }}>
                  {(slice.pct * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

function arcPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startAngle: number,
  endAngle: number,
): string {
  const angle = endAngle - startAngle;
  if (angle <= 0.0005) return "";
  const largeArc = angle > Math.PI ? 1 : 0;
  const x1 = cx + Math.cos(startAngle) * rOuter;
  const y1 = cy + Math.sin(startAngle) * rOuter;
  const x2 = cx + Math.cos(endAngle) * rOuter;
  const y2 = cy + Math.sin(endAngle) * rOuter;

  if (rInner <= 0) {
    return `M ${cx} ${cy} L ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }
  const x3 = cx + Math.cos(endAngle) * rInner;
  const y3 = cy + Math.sin(endAngle) * rInner;
  const x4 = cx + Math.cos(startAngle) * rInner;
  const y4 = cy + Math.sin(startAngle) * rInner;
  return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}
