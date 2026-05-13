import type { CompositionInfo } from "../../schema";
import type { AreaChartProps } from "./AreaChart";

export const areaChartDefaultProps: AreaChartProps = {
  title: "Signups",
  caption: "Last 8 weeks",
  labels: "W1, W2, W3, W4, W5, W6, W7, W8",
  values: "120, 145, 132, 168, 195, 224, 270, 312",
  showAxes: true,
  showGrid: true,
};

export const areaChartInfo: CompositionInfo<AreaChartProps> = {
  id: "AreaChart",
  title: "Area Chart",
  description:
    "A line chart filled with a soft gradient underneath, sweeping up from the baseline as the data reveals.",
  durationInFrames: 180,
  fps: 60,
  width: 1920,
  height: 1080,
  defaultProps: areaChartDefaultProps,
  fields: [
    { kind: "text", key: "title", label: "Title" },
    { kind: "text", key: "caption", label: "Caption" },
    { kind: "text", key: "labels", label: "Labels" },
    { kind: "text", key: "values", label: "Values" },
    { kind: "switch", key: "showAxes", label: "Show axes" },
    { kind: "switch", key: "showGrid", label: "Show grid" },
  ],
};
