import type { CompositionInfo } from "../../schema";
import type { StatCounterProps } from "./StatCounter";

export const STAT_COUNTER_DURATION = 170;
export const STAT_COUNTER_FPS = 60;
export const STAT_COUNTER_WIDTH = 1920;
export const STAT_COUNTER_HEIGHT = 1080;

export const statCounterDefaultProps: StatCounterProps = {
  target: 12847,
  label: "developers",
  prefix: "",
  suffix: "+",
};

export const statCounterInfo: CompositionInfo<StatCounterProps> = {
  id: "StatCounter",
  title: "Stat Counter",
  description:
    "An animated number that ticks from 0 up to a target value, with a label fading in below.",
  durationInFrames: STAT_COUNTER_DURATION,
  fps: STAT_COUNTER_FPS,
  width: STAT_COUNTER_WIDTH,
  height: STAT_COUNTER_HEIGHT,
  defaultProps: statCounterDefaultProps,
  fields: [
    { kind: "number", key: "target", label: "Target value", min: 0 },
    { kind: "text", key: "label", label: "Label" },
    { kind: "text", key: "prefix", label: "Prefix (e.g. $)" },
    { kind: "text", key: "suffix", label: "Suffix (e.g. +, %)" },
  ],
};
