import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextTypewriterProps } from "./TextTypewriter";

export const TEXT_TYPEWRITER_DURATION = 100;
export const TEXT_TYPEWRITER_FPS = 60;
export const TEXT_TYPEWRITER_WIDTH = 1920;
export const TEXT_TYPEWRITER_HEIGHT = 1080;

export const textTypewriterDefaultProps: TextTypewriterProps = {
  headline: "Type it out",
  subtitle: "Editorial rhythm",
};

export const textTypewriterInfo: CompositionInfo<TextTypewriterProps> = {
  id: "TextTypewriter",
  title: "Typewriter",
  description:
    "Per-character stepped reveal with a minimal editorial typing rhythm.",
  durationInFrames: TEXT_TYPEWRITER_DURATION,
  fps: TEXT_TYPEWRITER_FPS,
  width: TEXT_TYPEWRITER_WIDTH,
  height: TEXT_TYPEWRITER_HEIGHT,
  defaultProps: textTypewriterDefaultProps,
  fields: TITLE_FIELDS,
};
