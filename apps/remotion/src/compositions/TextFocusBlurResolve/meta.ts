import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextFocusBlurResolveProps } from "./TextFocusBlurResolve";

export const textFocusBlurResolveInfo: CompositionInfo<TextFocusBlurResolveProps> =
  {
    id: "TextFocusBlurResolve",
    title: "Focus Pull",
    description:
      "A premium focus pull from heavy blur to crisp text, then a soft blur-out exit.",
    durationInFrames: 100,
    fps: 60,
    width: 1920,
    height: 1080,
    defaultProps: {
      headline: "Sharp resolve",
      subtitle: "From blur to clarity",
    },
    fields: TITLE_FIELDS,
  };
