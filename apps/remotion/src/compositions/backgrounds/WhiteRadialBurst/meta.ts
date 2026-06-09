import type { CompositionInfo } from "../../../schema";
import type { WhiteRadialBurstProps } from "./WhiteRadialBurst";

export const WHITE_RADIAL_BURST_DURATION = 180;
export const WHITE_RADIAL_BURST_FPS = 60;
export const WHITE_RADIAL_BURST_WIDTH = 1920;
export const WHITE_RADIAL_BURST_HEIGHT = 1080;

export const whiteRadialBurstDefaultProps: WhiteRadialBurstProps = {
  rayCount: 64,
};

export const whiteRadialBurstInfo: CompositionInfo<WhiteRadialBurstProps> = {
  id: "WhiteRadialBurst",
  category: "background",
  agentNotes:
    "Energetic white backdrop with thin blue lines bursting from center. Use behind impact stats, infographic beats, or a key reveal. Line color comes from the Style section (accent).",
  title: "White Radial Burst",
  description:
    "White background with thin blue lines radiating outward from the center.",
  durationInFrames: WHITE_RADIAL_BURST_DURATION,
  fps: WHITE_RADIAL_BURST_FPS,
  width: WHITE_RADIAL_BURST_WIDTH,
  height: WHITE_RADIAL_BURST_HEIGHT,
  defaultProps: whiteRadialBurstDefaultProps,
  fields: [
    { kind: "number", key: "rayCount", label: "Ray count", min: 12, max: 160 },
  ],
};
