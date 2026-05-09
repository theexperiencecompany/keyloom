import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextShortSlideDownProps } from "./TextShortSlideDown";

export const TEXT_SHORT_SLIDE_DOWN_DURATION = 100;
export const TEXT_SHORT_SLIDE_DOWN_FPS = 60;
export const TEXT_SHORT_SLIDE_DOWN_WIDTH = 1920;
export const TEXT_SHORT_SLIDE_DOWN_HEIGHT = 1080;

export const textShortSlideDownDefaultProps: TextShortSlideDownProps = {
  headline: "Drop it down",
  subtitle: "Top-down kinetic build",
};

export const textShortSlideDownInfo: CompositionInfo<TextShortSlideDownProps> =
  {
    id: "TextShortSlideDown",
    title: "Short Slide Down",
    description:
      "Each new word drops in from above into its own line and pushes the existing stack downward until a centered three-line composition locks in place.",
    durationInFrames: TEXT_SHORT_SLIDE_DOWN_DURATION,
    fps: TEXT_SHORT_SLIDE_DOWN_FPS,
    width: TEXT_SHORT_SLIDE_DOWN_WIDTH,
    height: TEXT_SHORT_SLIDE_DOWN_HEIGHT,
    defaultProps: textShortSlideDownDefaultProps,
    fields: TITLE_FIELDS,
  };
