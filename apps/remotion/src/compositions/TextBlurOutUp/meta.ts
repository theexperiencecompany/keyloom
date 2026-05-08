import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextBlurOutUpProps } from "./TextBlurOutUp";

export const TEXT_BLUR_OUT_UP_DURATION = 220;

const defaultProps: TextBlurOutUpProps = {
  headline: "Light as air",
  subtitle: "Words arrive clean",
  backgroundColor: "#0a0a0a",
  textColor: "#ffffff",
};

export const textBlurOutUpInfo: CompositionInfo<TextBlurOutUpProps> = {
  id: "TextBlurOutUp",
  title: "Blur Rise",
  description:
    "Words arrive clean and depart upward with increasing blur for airy exits.",
  durationInFrames: TEXT_BLUR_OUT_UP_DURATION,
  fps: 60,
  width: 1920,
  height: 1080,
  defaultProps,
  fields: TITLE_FIELDS,
};
