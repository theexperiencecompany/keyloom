import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextFadeThroughProps } from "./TextFadeThrough";

export const textFadeThroughInfo: CompositionInfo<TextFadeThroughProps> = {
  id: "TextFadeThrough",
  title: "Fade Through",
  description:
    "A Material-style content transition: old fades out, new fades in with a soft delay.",
  durationInFrames: 100,
  fps: 60,
  width: 1920,
  height: 1080,
  defaultProps: {
    headline: "Content transitions",
    subtitle: "Material-inspired motion",
  },
  fields: TITLE_FIELDS,
};
