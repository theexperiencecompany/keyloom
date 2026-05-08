import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextPerCharacterRiseProps } from "./TextPerCharacterRise";

export const TEXT_PER_CHARACTER_RISE_DURATION = 220;
export const TEXT_PER_CHARACTER_RISE_FPS = 60;
export const TEXT_PER_CHARACTER_RISE_WIDTH = 1920;
export const TEXT_PER_CHARACTER_RISE_HEIGHT = 1080;

export const textPerCharacterRiseDefaultProps: TextPerCharacterRiseProps = {
  headline: "Rise and shine",
  subtitle: "Clean and crisp",
  backgroundColor: "#ffffff",
  textColor: "#0f1014",
};

export const textPerCharacterRiseInfo: CompositionInfo<TextPerCharacterRiseProps> = {
  id: "TextPerCharacterRise",
  title: "Character Rise",
  description:
    "Letters slide up from below with no blur — crisp, deliberate, kinetic. Apple's clean tvOS-style reveal.",
  durationInFrames: TEXT_PER_CHARACTER_RISE_DURATION,
  fps: TEXT_PER_CHARACTER_RISE_FPS,
  width: TEXT_PER_CHARACTER_RISE_WIDTH,
  height: TEXT_PER_CHARACTER_RISE_HEIGHT,
  defaultProps: textPerCharacterRiseDefaultProps,
  fields: TITLE_FIELDS,
};
