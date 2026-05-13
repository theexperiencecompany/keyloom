import type { CompositionInfo } from "../../schema";
import type { RadialChartProps } from "./RadialChart";

export const radialChartDefaultProps: RadialChartProps = {
  title: "Conversion rate",
  caption: "Q4 target · in progress",
  label: "of monthly goal",
  value: 76,
  max: 100,
  unit: "%",
};

export const radialChartInfo: CompositionInfo<RadialChartProps> = {
  id: "RadialChart",
  title: "Radial Chart",
  description:
    "A single-stat radial gauge that sweeps an arc to a target percentage with the count rolling up in the middle.",
  durationInFrames: 180,
  fps: 60,
  width: 1920,
  height: 1080,
  defaultProps: radialChartDefaultProps,
  fields: [
    { kind: "text", key: "title", label: "Title" },
    { kind: "text", key: "caption", label: "Caption" },
    { kind: "text", key: "label", label: "Centered label" },
    { kind: "number", key: "value", label: "Value", min: 0 },
    { kind: "number", key: "max", label: "Max", min: 1 },
    { kind: "text", key: "unit", label: "Unit (e.g. %)" },
  ],
};
