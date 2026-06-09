import type { CompositionInfo } from "../../../schema";
import type { BlueGridProps } from "./BlueGrid";

export const BLUE_GRID_DURATION = 180;
export const BLUE_GRID_FPS = 60;
export const BLUE_GRID_WIDTH = 1920;
export const BLUE_GRID_HEIGHT = 1080;

export const blueGridDefaultProps: BlueGridProps = {
  cellSize: 72,
};

export const blueGridInfo: CompositionInfo<BlueGridProps> = {
  id: "BlueGrid",
  category: "background",
  agentNotes:
    "Futuristic cobalt-blue grid with a soft white corner glow. Use behind product/tech segments that need a digital, structured feel. Background tint comes from the Style section.",
  title: "Blue Grid",
  description:
    "Vivid cobalt-blue field with a faint square grid and a soft white corner glow.",
  durationInFrames: BLUE_GRID_DURATION,
  fps: BLUE_GRID_FPS,
  width: BLUE_GRID_WIDTH,
  height: BLUE_GRID_HEIGHT,
  defaultProps: blueGridDefaultProps,
  fields: [
    {
      kind: "number",
      key: "cellSize",
      label: "Cell size (px)",
      min: 24,
      max: 200,
    },
  ],
};
