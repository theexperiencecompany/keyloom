import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextSharedAxisXProps } from "./TextSharedAxisX";

export const textSharedAxisXInfo: CompositionInfo<TextSharedAxisXProps> = {
  id: "TextSharedAxisX",
  title: "Slide In",
  description:
    "Horizontal shared-axis transition for sibling destinations with continuity.",
  durationInFrames: 100,
  fps: 60,
  width: 1920,
  height: 1080,
  defaultProps: {
    headline: "Moving forward",
    subtitle: "Horizontal continuity",
  },
  fields: TITLE_FIELDS,
};
