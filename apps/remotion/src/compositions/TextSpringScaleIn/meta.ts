import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextSpringScaleInProps } from "./TextSpringScaleIn";

export const TEXT_SPRING_SCALE_IN_DURATION = 220;

const defaultProps: TextSpringScaleInProps = {
  headline: "Bold and alive",
  subtitle: "Spring into action",
  backgroundColor: "#ffffff",
  textColor: "#0f1014",
};

export const textSpringScaleInInfo: CompositionInfo<TextSpringScaleInProps> = {
  id: "TextSpringScaleIn",
  title: "Spring Pop",
  description:
    "Words pop in with a soft overshoot scale, like a physical spring settling into place.",
  durationInFrames: TEXT_SPRING_SCALE_IN_DURATION,
  fps: 60,
  width: 1920,
  height: 1080,
  defaultProps,
  fields: TITLE_FIELDS,
};
