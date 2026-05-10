import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TitleSlideUpProps } from "./TitleSlideUp";

export const TITLE_SLIDE_UP_DURATION = 100;
export const TITLE_SLIDE_UP_FPS = 60;
export const TITLE_SLIDE_UP_WIDTH = 1920;
export const TITLE_SLIDE_UP_HEIGHT = 1080;

export const titleSlideUpDefaultProps: TitleSlideUpProps = {
  headline: "Designed in California",
  subtitle: "Assembled with care",
};

export const titleSlideUpInfo: CompositionInfo<TitleSlideUpProps> = {
  id: "TitleSlideUp",
  title: "Slide Up",
  description:
    "An Apple-style intro: a bold headline that rises from a baseline word-by-word, with an optional subtitle that fades in below.",
  durationInFrames: TITLE_SLIDE_UP_DURATION,
  fps: TITLE_SLIDE_UP_FPS,
  width: TITLE_SLIDE_UP_WIDTH,
  height: TITLE_SLIDE_UP_HEIGHT,
  defaultProps: titleSlideUpDefaultProps,
  fields: TITLE_FIELDS,
};
