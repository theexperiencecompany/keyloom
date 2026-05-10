import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TitlePopupProps } from "./TitlePopup";

export const TITLE_POPUP_DURATION = 100;
export const TITLE_POPUP_FPS = 60;
export const TITLE_POPUP_WIDTH = 1920;
export const TITLE_POPUP_HEIGHT = 1080;

export const titlePopupDefaultProps: TitlePopupProps = {
  headline: "Boom.",
  subtitle: "Just like that.",
};

export const titlePopupInfo: CompositionInfo<TitlePopupProps> = {
  id: "TitlePopup",
  title: "Pop In",
  description:
    "A punchy spring-driven title: the headline scales and bounces in as a single unit. Best for short, high-impact one-liners.",
  durationInFrames: TITLE_POPUP_DURATION,
  fps: TITLE_POPUP_FPS,
  width: TITLE_POPUP_WIDTH,
  height: TITLE_POPUP_HEIGHT,
  defaultProps: titlePopupDefaultProps,
  fields: TITLE_FIELDS,
};
