import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextMaskRevealUpProps } from "./TextMaskRevealUp";

export const textMaskRevealUpInfo: CompositionInfo<TextMaskRevealUpProps> = {
  id: "TextMaskRevealUp",
  title: "Line Reveal",
  description:
    "Lines reveal upward with a soft masked feel and compact stagger.",
  durationInFrames: 100,
  fps: 60,
  width: 1920,
  height: 1080,
  defaultProps: {
    headline: "Line one\nLine two\nLine three",
    subtitle: "Lines rise together",
  },
  fields: TITLE_FIELDS,
};
