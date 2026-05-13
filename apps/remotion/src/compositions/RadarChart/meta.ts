import type { CompositionInfo } from "../../schema";
import type { RadarChartProps } from "./RadarChart";

export const radarChartDefaultProps: RadarChartProps = {
  title: "Engineering audit",
  caption: "Score by category · out of 100",
  labels: "Speed, Quality, Reliability, Tests, Docs, DX",
  values: "78, 92, 84, 65, 70, 88",
};

export const radarChartInfo: CompositionInfo<RadarChartProps> = {
  id: "RadarChart",
  title: "Radar Chart",
  description:
    "A radar chart that expands each axis outward simultaneously to reveal a filled polygon footprint.",
  durationInFrames: 200,
  fps: 60,
  width: 1920,
  height: 1080,
  defaultProps: radarChartDefaultProps,
  fields: [
    { kind: "text", key: "title", label: "Title" },
    { kind: "text", key: "caption", label: "Caption" },
    { kind: "text", key: "labels", label: "Axes (comma-separated)" },
    { kind: "text", key: "values", label: "Values (comma-separated)" },
  ],
};
