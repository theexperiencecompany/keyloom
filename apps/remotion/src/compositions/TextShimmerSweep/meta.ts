import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextShimmerSweepProps } from "./TextShimmerSweep";

export const textShimmerSweepInfo: CompositionInfo<TextShimmerSweepProps> = {
  id: "TextShimmerSweep",
  title: "Shimmer Sweep",
  description:
    "A subtle sweep across a clean headline, blending in while gliding from left to center.",
  durationInFrames: 220,
  fps: 60,
  width: 1920,
  height: 1080,
  defaultProps: {
    headline: "Sweeping clarity",
    subtitle: "A premium micro-transition",
    backgroundColor: "#ffffff",
    textColor: "#0f1014",
  },
  fields: TITLE_FIELDS,
};
