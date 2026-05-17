import type { CompositionInfo } from "../../schema";
import type { LaptopFrameProps } from "./LaptopFrame";

export const LAPTOP_FRAME_DURATION = 780;
export const LAPTOP_FRAME_FPS = 60;
export const LAPTOP_FRAME_WIDTH = 1920;
export const LAPTOP_FRAME_HEIGHT = 1080;

export const laptopFrameDefaultProps: LaptopFrameProps = {
  chassis: "space-gray",
  innerCompositionId: "BrowserWindow",
  screenImage: "",
};

export const laptopFrameInfo: CompositionInfo<LaptopFrameProps> = {
  id: "LaptopFrame",
  title: "Laptop Frame",
  description:
    "Wraps any other composition inside a realistic laptop mockup with a drop-in entrance.",
  durationInFrames: LAPTOP_FRAME_DURATION,
  fps: LAPTOP_FRAME_FPS,
  width: LAPTOP_FRAME_WIDTH,
  height: LAPTOP_FRAME_HEIGHT,
  defaultProps: laptopFrameDefaultProps,
  fields: [
    {
      kind: "select",
      key: "chassis",
      label: "Chassis",
      options: [
        { value: "space-gray", label: "Space Gray" },
        { value: "silver", label: "Silver" },
      ],
    },
    {
      kind: "image",
      key: "screenImage",
      label: "Screen image",
      placeholder: "Or paste an image URL",
    },
    {
      kind: "composition",
      key: "innerCompositionId",
      label: "Screen content",
      exclude: ["LaptopFrame", "PhoneFrame"],
    },
    {
      kind: "innerProps",
      key: "innerProps",
      label: "Inner content",
      compositionKey: "innerCompositionId",
    },
  ],
};
