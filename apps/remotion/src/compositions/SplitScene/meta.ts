import type { CompositionInfo } from "../../schema";
import type { SplitSceneProps } from "./SplitScene";
import { LAYOUT_SLOT_COUNTS } from "./layout";

export const SPLIT_SCENE_DURATION = 600;
export const SPLIT_SCENE_FPS = 60;
export const SPLIT_SCENE_WIDTH = 1920;
export const SPLIT_SCENE_HEIGHT = 1080;

export const splitSceneDefaultProps: SplitSceneProps = {
  layout: "side-by-side",
  slots: ["TweetCard", "StatCounter"],
  backgroundColor: "#0f1014",
  gap: 16,
};

export const splitSceneInfo: CompositionInfo<SplitSceneProps> = {
  id: "SplitScene",
  title: "Split Scene",
  description:
    "Combine multiple compositions in one frame using a preset layout — stacked, side-by-side, picture-in-picture, or 2×2 grid.",
  durationInFrames: SPLIT_SCENE_DURATION,
  fps: SPLIT_SCENE_FPS,
  width: SPLIT_SCENE_WIDTH,
  height: SPLIT_SCENE_HEIGHT,
  defaultProps: splitSceneDefaultProps,
  fields: [
    {
      kind: "select",
      key: "layout",
      label: "Layout",
      options: [
        { value: "side-by-side", label: "Side by side" },
        { value: "stacked", label: "Stacked" },
        { value: "pip", label: "Picture in picture" },
        { value: "grid-2x2", label: "Grid 2×2" },
      ],
    },
    {
      kind: "slots",
      key: "slots",
      label: "Slots",
      layoutKey: "layout",
      counts: LAYOUT_SLOT_COUNTS,
      exclude: ["SplitScene"],
    },
    { kind: "color", key: "backgroundColor", label: "Background color" },
    { kind: "number", key: "gap", label: "Gap (px)", min: 0, max: 80 },
  ],
};
