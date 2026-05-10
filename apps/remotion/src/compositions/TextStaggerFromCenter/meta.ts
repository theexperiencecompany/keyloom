import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextStaggerFromCenterProps } from "./TextStaggerFromCenter";

export const TEXT_STAGGER_FROM_CENTER_DURATION = 100;
export const TEXT_STAGGER_FROM_CENTER_FPS = 60;
export const TEXT_STAGGER_FROM_CENTER_WIDTH = 1920;
export const TEXT_STAGGER_FROM_CENTER_HEIGHT = 1080;

export const textStaggerFromCenterDefaultProps: TextStaggerFromCenterProps = {
  headline: "Centered focus",
  subtitle: "From the core outward",
};

export const textStaggerFromCenterInfo: CompositionInfo<TextStaggerFromCenterProps> =
  {
    id: "TextStaggerFromCenter",
    title: "Center Stagger",
    description:
      "Characters reveal from the center outward to emphasize the keyword core.",
    durationInFrames: TEXT_STAGGER_FROM_CENTER_DURATION,
    fps: TEXT_STAGGER_FROM_CENTER_FPS,
    width: TEXT_STAGGER_FROM_CENTER_WIDTH,
    height: TEXT_STAGGER_FROM_CENTER_HEIGHT,
    defaultProps: textStaggerFromCenterDefaultProps,
    fields: TITLE_FIELDS,
  };
