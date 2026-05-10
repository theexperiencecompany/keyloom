import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextSharedAxisZProps } from "./TextSharedAxisZ";

export const textSharedAxisZInfo: CompositionInfo<TextSharedAxisZProps> = {
  id: "TextSharedAxisZ",
  title: "Depth Fade",
  description:
    "Scale-based shared-axis transition for focus shifts and context depth.",
  durationInFrames: 100,
  fps: 60,
  width: 1920,
  height: 1080,
  defaultProps: {
    headline: "Focus and depth",
    subtitle: "Context through scale",
  },
  fields: TITLE_FIELDS,
};
