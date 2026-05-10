import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TitleTypeProps } from "./TitleType";

export const TITLE_TYPE_DURATION = 100;
export const TITLE_TYPE_FPS = 60;
export const TITLE_TYPE_WIDTH = 1920;
export const TITLE_TYPE_HEIGHT = 1080;

export const titleTypeDefaultProps: TitleTypeProps = {
  headline: "hello, world.",
  subtitle: "now typing live",
};

export const titleTypeInfo: CompositionInfo<TitleTypeProps> = {
  id: "TitleType",
  title: "Typewriter",
  description:
    "A monospaced typewriter intro: characters reveal one at a time with a blinking caret, ending with an optional subtitle that fades in below.",
  durationInFrames: TITLE_TYPE_DURATION,
  fps: TITLE_TYPE_FPS,
  width: TITLE_TYPE_WIDTH,
  height: TITLE_TYPE_HEIGHT,
  defaultProps: titleTypeDefaultProps,
  fields: TITLE_FIELDS,
};
