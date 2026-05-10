import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextDepthParallaxWordsProps } from "./TextDepthParallaxWords";

export const TEXT_DEPTH_PARALLAX_WORDS_DURATION = 100;

const defaultProps: TextDepthParallaxWordsProps = {
  headline: "Depth of meaning",
  subtitle: "Layer upon layer",
};

export const textDepthParallaxWordsInfo: CompositionInfo<TextDepthParallaxWordsProps> =
  {
    id: "TextDepthParallaxWords",
    title: "Word Parallax",
    description:
      "Per-word depth motion with scale and vertical drift for layered readability.",
    durationInFrames: TEXT_DEPTH_PARALLAX_WORDS_DURATION,
    fps: 60,
    width: 1920,
    height: 1080,
    defaultProps,
    fields: TITLE_FIELDS,
  };
