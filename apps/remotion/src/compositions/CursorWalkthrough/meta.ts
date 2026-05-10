import type { CompositionInfo } from "../../schema";
import type { CursorWalkthroughProps } from "./CursorWalkthrough";

export const CURSOR_WALKTHROUGH_DURATION = 280;
export const CURSOR_WALKTHROUGH_FPS = 60;
export const CURSOR_WALKTHROUGH_WIDTH = 1920;
export const CURSOR_WALKTHROUGH_HEIGHT = 1080;

export const cursorWalkthroughDefaultProps: CursorWalkthroughProps = {
  backgroundImageUrl: "",
  firstClickX: 720,
  firstClickY: 480,
  firstClickLabel: "Open the search",
  inputText: "best new tech of 2025",
  secondClickX: 1280,
  secondClickY: 720,
  secondClickLabel: "Hit search",
};

export const cursorWalkthroughInfo: CompositionInfo<CursorWalkthroughProps> = {
  id: "CursorWalkthrough",
  title: "Cursor Walkthrough",
  description:
    "A cursor that demonstrates a click → type → click flow over a screenshot. Drop in a background image and pin the click coordinates.",
  durationInFrames: CURSOR_WALKTHROUGH_DURATION,
  fps: CURSOR_WALKTHROUGH_FPS,
  width: CURSOR_WALKTHROUGH_WIDTH,
  height: CURSOR_WALKTHROUGH_HEIGHT,
  defaultProps: cursorWalkthroughDefaultProps,
  fields: [
    {
      kind: "text",
      key: "backgroundImageUrl",
      label: "Background image URL",
    },
    { kind: "number", key: "firstClickX", label: "First click X", min: 0 },
    { kind: "number", key: "firstClickY", label: "First click Y", min: 0 },
    { kind: "text", key: "firstClickLabel", label: "First click label" },
    { kind: "text", key: "inputText", label: "Text to type" },
    { kind: "number", key: "secondClickX", label: "Second click X", min: 0 },
    { kind: "number", key: "secondClickY", label: "Second click Y", min: 0 },
    { kind: "text", key: "secondClickLabel", label: "Second click label" },
  ],
};
