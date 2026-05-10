import type { CompositionInfo } from "../../schema";
import type { PhoneFrameProps } from "./PhoneFrame";

export const PHONE_FRAME_DURATION = 780;
export const PHONE_FRAME_FPS = 60;
export const PHONE_FRAME_WIDTH = 1920;
export const PHONE_FRAME_HEIGHT = 1080;

export const phoneFrameDefaultProps: PhoneFrameProps = {
  device: "dynamic-island",
  innerCompositionId: "MessageBubbles",
  screenImage: "",
};

export const phoneFrameInfo: CompositionInfo<PhoneFrameProps> = {
  id: "PhoneFrame",
  title: "Phone Frame",
  description:
    "Wraps any other composition inside a realistic iPhone mockup with a drop-in entrance.",
  durationInFrames: PHONE_FRAME_DURATION,
  fps: PHONE_FRAME_FPS,
  width: PHONE_FRAME_WIDTH,
  height: PHONE_FRAME_HEIGHT,
  defaultProps: phoneFrameDefaultProps,
  fields: [
    {
      kind: "select",
      key: "device",
      label: "Device",
      options: [
        { value: "dynamic-island", label: "iPhone (Dynamic Island)" },
        { value: "notch", label: "iPhone (Notch)" },
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
      exclude: ["PhoneFrame"],
    },
  ],
};
