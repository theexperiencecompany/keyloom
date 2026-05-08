import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextShortSlideRightProps } from "./TextShortSlideRight";

export const TEXT_SHORT_SLIDE_RIGHT_DURATION = 220;

const defaultProps: TextShortSlideRightProps = {
  headline: "Words slide into place",
  subtitle: "One shared motion",
  backgroundColor: "#ffffff",
  textColor: "#0f1014",
};

export const textShortSlideRightInfo: CompositionInfo<TextShortSlideRightProps> =
  {
    id: "TextShortSlideRight",
    title: "Short Slide Right",
    description:
      "The whole phrase glides in from the left as one compact move, while the words themselves are revealed in sequence only through opacity.",
    durationInFrames: TEXT_SHORT_SLIDE_RIGHT_DURATION,
    fps: 60,
    width: 1920,
    height: 1080,
    defaultProps,
    fields: TITLE_FIELDS,
  };
