import type { CompositionInfo } from "../../schema";
import type { MetricCardProps } from "./MetricCard";

export const METRIC_CARD_DURATION = 100;
export const METRIC_CARD_FPS = 60;
export const METRIC_CARD_WIDTH = 1280;
export const METRIC_CARD_HEIGHT = 720;

export const metricCardDefaultProps: MetricCardProps = {
  value: 10,
  prefix: "",
  suffix: "x",
  label: "faster than ever",
  sublabel: "Average response time vs. last quarter",
  theme: "light",
};

export const metricCardInfo: CompositionInfo<MetricCardProps> = {
  id: "MetricCard",
  title: "Metric Card",
  description:
    "A polished card that counts up to a big number with a label and sublabel — perfect for 'by the numbers' sections.",
  durationInFrames: METRIC_CARD_DURATION,
  fps: METRIC_CARD_FPS,
  width: METRIC_CARD_WIDTH,
  height: METRIC_CARD_HEIGHT,
  defaultProps: metricCardDefaultProps,
  fields: [
    { kind: "number", key: "value", label: "Value" },
    { kind: "text", key: "prefix", label: "Prefix (e.g. $)" },
    { kind: "text", key: "suffix", label: "Suffix (e.g. x, %, K)" },
    { kind: "text", key: "label", label: "Label" },
    { kind: "text", key: "sublabel", label: "Sublabel" },
    {
      kind: "select",
      key: "theme",
      label: "Theme",
      options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ],
    },
  ],
};
