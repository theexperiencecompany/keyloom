import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextBottomUpLettersProps } from "./TextBottomUpLetters";

export const TEXT_BOTTOM_UP_LETTERS_DURATION = 100;
export const TEXT_BOTTOM_UP_LETTERS_FPS = 60;
export const TEXT_BOTTOM_UP_LETTERS_WIDTH = 1920;
export const TEXT_BOTTOM_UP_LETTERS_HEIGHT = 1080;

export const textBottomUpLettersDefaultProps: TextBottomUpLettersProps = {
  headline: "ASCEND",
  subtitle: "One letter at a time",
};

export const textBottomUpLettersInfo: CompositionInfo<TextBottomUpLettersProps> =
  {
    id: "TextBottomUpLetters",
    title: "Letters Rise Up",
    description:
      "Letters rise from below in a pronounced staircase, one symbol at a time, with zero blur.",
    durationInFrames: TEXT_BOTTOM_UP_LETTERS_DURATION,
    fps: TEXT_BOTTOM_UP_LETTERS_FPS,
    width: TEXT_BOTTOM_UP_LETTERS_WIDTH,
    height: TEXT_BOTTOM_UP_LETTERS_HEIGHT,
    defaultProps: textBottomUpLettersDefaultProps,
    fields: TITLE_FIELDS,
  };
