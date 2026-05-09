import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextSoftBlurInProps } from "./TextSoftBlurIn";

export const TEXT_SOFT_BLUR_IN_DURATION = 100;
export const TEXT_SOFT_BLUR_IN_FPS = 60;
export const TEXT_SOFT_BLUR_IN_WIDTH = 1920;
export const TEXT_SOFT_BLUR_IN_HEIGHT = 1080;

export const textSoftBlurInDefaultProps: TextSoftBlurInProps = {
  headline: "Precision in motion",
  subtitle: "Character by character",
};

export const textSoftBlurInInfo: CompositionInfo<TextSoftBlurInProps> = {
  id: "TextSoftBlurIn",
  title: "Soft Blur In",
  description:
    "Per-character fade-in with a gentle blur and upward motion. Apple's signature hero-title reveal.",
  durationInFrames: TEXT_SOFT_BLUR_IN_DURATION,
  fps: TEXT_SOFT_BLUR_IN_FPS,
  width: TEXT_SOFT_BLUR_IN_WIDTH,
  height: TEXT_SOFT_BLUR_IN_HEIGHT,
  defaultProps: textSoftBlurInDefaultProps,
  fields: TITLE_FIELDS,
};
