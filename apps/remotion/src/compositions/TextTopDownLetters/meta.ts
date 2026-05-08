import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextTopDownLettersProps } from "./TextTopDownLetters";

export const TEXT_TOP_DOWN_LETTERS_DURATION = 220;
export const TEXT_TOP_DOWN_LETTERS_FPS = 60;
export const TEXT_TOP_DOWN_LETTERS_WIDTH = 1920;
export const TEXT_TOP_DOWN_LETTERS_HEIGHT = 1080;

export const textTopDownLettersDefaultProps: TextTopDownLettersProps = {
  headline: "DESCEND",
  subtitle: "From above",
  backgroundColor: "#0f1014",
  textColor: "#ffffff",
};

export const textTopDownLettersInfo: CompositionInfo<TextTopDownLettersProps> = {
  id: "TextTopDownLetters",
  title: "Letters Drop Down",
  description:
    "Letters descend from above in a pronounced staircase, one symbol at a time, with zero blur.",
  durationInFrames: TEXT_TOP_DOWN_LETTERS_DURATION,
  fps: TEXT_TOP_DOWN_LETTERS_FPS,
  width: TEXT_TOP_DOWN_LETTERS_WIDTH,
  height: TEXT_TOP_DOWN_LETTERS_HEIGHT,
  defaultProps: textTopDownLettersDefaultProps,
  fields: TITLE_FIELDS,
};
