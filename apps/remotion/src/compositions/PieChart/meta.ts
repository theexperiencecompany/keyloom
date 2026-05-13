import type { CompositionInfo } from "../../schema";
import type { PieChartProps } from "./PieChart";

export const pieChartDefaultProps: PieChartProps = {
  title: "Traffic sources",
  caption: "Last 30 days",
  labels: "Organic, Direct, Referral, Social, Paid",
  values: "42, 24, 14, 12, 8",
  donut: true,
  showLegend: true,
};

export const pieChartInfo: CompositionInfo<PieChartProps> = {
  id: "PieChart",
  title: "Pie Chart",
  description:
    "A pie / donut chart that sweeps each slice in clockwise, with a legend and an optional total in the center.",
  durationInFrames: 200,
  fps: 60,
  width: 1920,
  height: 1080,
  defaultProps: pieChartDefaultProps,
  fields: [
    { kind: "text", key: "title", label: "Title" },
    { kind: "text", key: "caption", label: "Caption" },
    { kind: "text", key: "labels", label: "Labels" },
    { kind: "text", key: "values", label: "Values" },
    { kind: "switch", key: "donut", label: "Donut" },
    { kind: "switch", key: "showLegend", label: "Show legend" },
  ],
};
