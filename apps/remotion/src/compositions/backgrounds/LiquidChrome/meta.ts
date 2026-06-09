import type { CompositionInfo } from "../../../schema";
import type { LiquidChromeProps } from "./LiquidChrome";

export const LIQUID_CHROME_DURATION = 180;
export const LIQUID_CHROME_FPS = 60;
export const LIQUID_CHROME_WIDTH = 1920;
export const LIQUID_CHROME_HEIGHT = 1080;

export const liquidChromeDefaultProps: LiquidChromeProps = {};

export const liquidChromeInfo: CompositionInfo<LiquidChromeProps> = {
  id: "LiquidChrome",
  category: "background",
  agentNotes:
    "Reflective liquid-chrome surface — silver and blue metallic gradients flowing through turbulence displacement with gliding specular streaks. A futuristic luxury backdrop for product or brand moments. The base field and metallic tint come from the Style section (background + accent).",
  title: "Liquid Chrome",
  description:
    "Minimal liquid chrome surface with reflective silver and blue gradients and smooth flowing metallic shapes.",
  durationInFrames: LIQUID_CHROME_DURATION,
  fps: LIQUID_CHROME_FPS,
  width: LIQUID_CHROME_WIDTH,
  height: LIQUID_CHROME_HEIGHT,
  defaultProps: liquidChromeDefaultProps,
  fields: [],
};
