import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextScaleDownFadeProps } from "./TextScaleDownFade";

export const textScaleDownFadeInfo: CompositionInfo<TextScaleDownFadeProps> = {
  id: "TextScaleDownFade",
  title: "Settle In",
  description:
    "Subtle premium settle-in with a restrained scale-down fade on exit.",
  durationInFrames: 100,
  fps: 60,
  width: 1920,
  height: 1080,
  defaultProps: {
    headline: "Premium settle",
    subtitle: "Restrained and precise",
  },
  fields: TITLE_FIELDS,
};
