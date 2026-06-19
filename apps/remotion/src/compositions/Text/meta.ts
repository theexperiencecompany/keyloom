import type { CompositionInfo } from "../../schema";
import { TEXT_ANIMATIONS } from "./animations";
import type { TextProps } from "./Text";

export const TEXT_DURATION = 120;
export const TEXT_FPS = 60;
export const TEXT_WIDTH = 1920;
export const TEXT_HEIGHT = 1080;

export const textDefaultProps: TextProps = {
  headline: "Designed in California",
  subtitle: "",
  animation: "fade",
};

export const textInfo: CompositionInfo<TextProps> = {
  id: "Text",
  category: "text",
  title: "Text",
  description:
    "Animated headline + subtitle. Pick from 28 animation styles in the Animation field.",
  durationInFrames: TEXT_DURATION,
  fps: TEXT_FPS,
  width: TEXT_WIDTH,
  height: TEXT_HEIGHT,
  defaultProps: textDefaultProps,
  fields: [
    {
      kind: "select",
      key: "animation",
      label: "Animation",
      options: TEXT_ANIMATIONS,
    },
    { kind: "textarea", key: "headline", label: "Headline", rows: 2 },
    {
      kind: "textarea",
      key: "subtitle",
      label: "Subtitle (optional)",
      rows: 2,
    },
  ],
};
