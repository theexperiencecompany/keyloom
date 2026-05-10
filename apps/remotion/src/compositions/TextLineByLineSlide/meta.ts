import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextLineByLineSlideProps } from "./TextLineByLineSlide";

export const textLineByLineSlideInfo: CompositionInfo<TextLineByLineSlideProps> =
  {
    id: "TextLineByLineSlide",
    title: "Line Slide In",
    description:
      "Each line enters from the left with a staggered slide and exits to the right for a flowing paragraph reveal.",
    durationInFrames: 100,
    fps: 60,
    width: 1920,
    height: 1080,
    defaultProps: {
      headline: "First comes clarity\nThen comes conviction\nThen comes change",
      subtitle: "Line by line",
    },
    fields: TITLE_FIELDS,
  };
