import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextSharedAxisYProps } from "./TextSharedAxisY";

export const TEXT_SHARED_AXIS_Y_DURATION = 220;

const defaultProps: TextSharedAxisYProps = {
  headline: "Sharp and direct",
  subtitle: "Word by word",
  backgroundColor: "#ffffff",
  textColor: "#0f1014",
};

export const textSharedAxisYInfo: CompositionInfo<TextSharedAxisYProps> = {
  id: "TextSharedAxisY",
  title: "Word Staircase",
  description:
    "Per-word hard-cut transition with staircase timing for sharp editorial swaps.",
  durationInFrames: TEXT_SHARED_AXIS_Y_DURATION,
  fps: 60,
  width: 1920,
  height: 1080,
  defaultProps,
  fields: TITLE_FIELDS,
};
