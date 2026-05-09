import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextKineticCenterBuildProps } from "./TextKineticCenterBuild";

export const TEXT_KINETIC_CENTER_BUILD_DURATION = 100;
export const TEXT_KINETIC_CENTER_BUILD_FPS = 60;
export const TEXT_KINETIC_CENTER_BUILD_WIDTH = 1920;
export const TEXT_KINETIC_CENTER_BUILD_HEIGHT = 1080;

export const textKineticCenterBuildDefaultProps: TextKineticCenterBuildProps = {
  headline: "Words push left",
  subtitle: "Kinetic center build",
};

export const textKineticCenterBuildInfo: CompositionInfo<TextKineticCenterBuildProps> =
  {
    id: "TextKineticCenterBuild",
    title: "Kinetic Center Build",
    description:
      "A word appears in the center; each new word enters from right to left with a soft blur and pushes the existing line until the full phrase locks centered.",
    durationInFrames: TEXT_KINETIC_CENTER_BUILD_DURATION,
    fps: TEXT_KINETIC_CENTER_BUILD_FPS,
    width: TEXT_KINETIC_CENTER_BUILD_WIDTH,
    height: TEXT_KINETIC_CENTER_BUILD_HEIGHT,
    defaultProps: textKineticCenterBuildDefaultProps,
    fields: TITLE_FIELDS,
  };
