import type { CompositionInfo } from "../../../schema";
import type { FuturisticArchProps } from "./FuturisticArch";

export const FUTURISTIC_ARCH_DURATION = 180;
export const FUTURISTIC_ARCH_FPS = 60;
export const FUTURISTIC_ARCH_WIDTH = 1920;
export const FUTURISTIC_ARCH_HEIGHT = 1080;

export const futuristicArchDefaultProps: FuturisticArchProps = {};

export const futuristicArchInfo: CompositionInfo<FuturisticArchProps> = {
  id: "FuturisticArch",
  category: "background",
  agentNotes:
    "Large smooth white curved surfaces sweep across the frame under soft blue ambient light with a slow drifting highlight — an ultra-clean luxury-technology brand environment. The base wash and ambient/highlight tint come from the Style section (background + accent); defaults to a light palette.",
  title: "Futuristic Architecture",
  description:
    "Minimal futuristic architecture with large white curved surfaces, soft blue ambient lighting, and a gentle moving light sweep.",
  durationInFrames: FUTURISTIC_ARCH_DURATION,
  fps: FUTURISTIC_ARCH_FPS,
  width: FUTURISTIC_ARCH_WIDTH,
  height: FUTURISTIC_ARCH_HEIGHT,
  defaultProps: futuristicArchDefaultProps,
  fields: [],
};
