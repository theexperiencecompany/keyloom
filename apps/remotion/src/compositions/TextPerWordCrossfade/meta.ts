import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextPerWordCrossfadeProps } from "./TextPerWordCrossfade";

export const TEXT_PER_WORD_CROSSFADE_DURATION = 100;

const defaultProps: TextPerWordCrossfadeProps = {
  headline: "Move the world forward",
  subtitle: "One word at a time",
};

export const textPerWordCrossfadeInfo: CompositionInfo<TextPerWordCrossfadeProps> =
  {
    id: "TextPerWordCrossfade",
    title: "Word Crossfade",
    description:
      "Words gently fade into place one after another, with a short vertical drift for a calm keynote rhythm.",
    durationInFrames: TEXT_PER_WORD_CROSSFADE_DURATION,
    fps: 60,
    width: 1920,
    height: 1080,
    defaultProps,
    fields: TITLE_FIELDS,
  };
