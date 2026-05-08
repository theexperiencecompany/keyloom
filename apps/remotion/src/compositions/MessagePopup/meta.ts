import type { CompositionInfo } from "../../schema";
import type { MessagePopupProps } from "./MessagePopup";

export const MESSAGE_POPUP_DURATION = 240;
export const MESSAGE_POPUP_FPS = 60;
export const MESSAGE_POPUP_WIDTH = 1280;
export const MESSAGE_POPUP_HEIGHT = 720;

export const messagePopupDefaultProps: MessagePopupProps = {
  sender: "her 💕",
  time: "now",
  body: "babe what is this claude code?",
  theme: "light",
};

export const messagePopupInfo: CompositionInfo<MessagePopupProps> = {
  id: "MessagePopup",
  title: "Message Popup",
  description:
    "An animated iOS-style notification banner. Edit the fields below to preview, then download an MP4.",
  durationInFrames: MESSAGE_POPUP_DURATION,
  fps: MESSAGE_POPUP_FPS,
  width: MESSAGE_POPUP_WIDTH,
  height: MESSAGE_POPUP_HEIGHT,
  defaultProps: messagePopupDefaultProps,
  fields: [
    { kind: "text", key: "sender", label: "Sender" },
    { kind: "text", key: "time", label: "Time" },
    { kind: "textarea", key: "body", label: "Body", rows: 2 },
    {
      kind: "select",
      key: "theme",
      label: "Theme",
      options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ],
    },
  ],
};
