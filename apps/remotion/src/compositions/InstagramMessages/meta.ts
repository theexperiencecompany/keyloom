import type { CompositionInfo } from "../../schema";
import type { InstagramMessagesProps } from "./InstagramMessages";

export const INSTAGRAM_MESSAGES_DURATION = 660;
export const INSTAGRAM_MESSAGES_FPS = 60;
export const INSTAGRAM_MESSAGES_WIDTH = 1280;
export const INSTAGRAM_MESSAGES_HEIGHT = 720;

export const instagramMessagesDefaultProps: InstagramMessagesProps = {
  contactName: "sanku",
  contactAvatar: "https://avatars.githubusercontent.com/aryanranderiya?s=200",
  messages: [
    { text: "saw your story 👀", side: "left", typingFrames: 50, delay: 30 },
    { text: "haha what about it", side: "right", typingFrames: 55, delay: 150 },
    {
      text: "where was that shot?",
      side: "left",
      typingFrames: 55,
      delay: 290,
    },
    { text: "bandra rooftop 🌇", side: "right", typingFrames: 48, delay: 430 },
    { text: "take me next time", side: "left", typingFrames: 50, delay: 560 },
  ],
  theme: "light",
  orientation: "landscape",
};

export const instagramMessagesInfo: CompositionInfo<InstagramMessagesProps> = {
  id: "InstagramMessages",
  title: "Instagram Messages",
  description:
    "An animated Instagram DM conversation with the gradient sent bubble, typing dots, and stacking spring physics.",
  durationInFrames: INSTAGRAM_MESSAGES_DURATION,
  fps: INSTAGRAM_MESSAGES_FPS,
  width: INSTAGRAM_MESSAGES_WIDTH,
  height: INSTAGRAM_MESSAGES_HEIGHT,
  defaultProps: instagramMessagesDefaultProps,
  brandMode: "locked",
  phoneFitMode: "cover",
  fields: [
    { kind: "text", key: "contactName", label: "Contact name" },
    { kind: "text", key: "contactAvatar", label: "Avatar URL" },
    { kind: "chat", key: "messages", label: "Messages" },
    {
      kind: "select",
      key: "theme",
      label: "Theme",
      options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ],
    },
    {
      kind: "select",
      key: "orientation",
      label: "Orientation",
      options: [
        { value: "landscape", label: "Landscape" },
        { value: "portrait", label: "Portrait (phone)" },
      ],
    },
  ],
};
