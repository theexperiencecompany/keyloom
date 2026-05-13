import type { CompositionInfo } from "../../schema";
import type { BarChartProps } from "./BarChart";

export const barChartDefaultProps: BarChartProps = {
  title: "Monthly active users",
  caption: "Past 6 months · in thousands",
  labels: "Jan, Feb, Mar, Apr, May, Jun",
  values: "42, 58, 49, 73, 84, 96",
  showAxes: true,
  showGrid: true,
  showValues: true,
};

export const barChartInfo: CompositionInfo<BarChartProps> = {
  id: "BarChart",
  title: "Bar Chart",
  description:
    "An animated bar chart with staggered grow-up bars, optional axes, gridlines, and value labels.",
  durationInFrames: 180,
  fps: 60,
  width: 1920,
  height: 1080,
  defaultProps: barChartDefaultProps,
  fields: [
    { kind: "text", key: "title", label: "Title" },
    { kind: "text", key: "caption", label: "Caption" },
    { kind: "text", key: "labels", label: "Labels (comma-separated)" },
    { kind: "text", key: "values", label: "Values (comma-separated numbers)" },
    { kind: "switch", key: "showAxes", label: "Show axes" },
    { kind: "switch", key: "showGrid", label: "Show grid" },
    { kind: "switch", key: "showValues", label: "Show values" },
  ],
};
