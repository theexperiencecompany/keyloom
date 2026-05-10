import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextMicroScaleFadeProps } from "./TextMicroScaleFade";

export const textMicroScaleFadeInfo: CompositionInfo<TextMicroScaleFadeProps> =
  {
    id: "TextMicroScaleFade",
    title: "Scale Fade",
    description:
      "A calm, tiny scale pop used as subtle premium polish for labels and headings.",
    durationInFrames: 100,
    fps: 60,
    width: 1920,
    height: 1080,
    defaultProps: {
      headline: "Quietly brilliant",
      subtitle: "Subtle is powerful",
    },
    fields: TITLE_FIELDS,
  };
