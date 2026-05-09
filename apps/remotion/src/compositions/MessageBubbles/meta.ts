import type { CompositionInfo } from "../../schema";
import type { MessageBubblesProps } from "./MessageBubbles";

export const MESSAGE_BUBBLES_DURATION = 660;
export const MESSAGE_BUBBLES_FPS = 60;
export const MESSAGE_BUBBLES_WIDTH = 1280;
export const MESSAGE_BUBBLES_HEIGHT = 720;

export const messageBubblesDefaultProps: MessageBubblesProps = {
  contactName: "sanku",
  contactAvatar: "https://github.com/aryanranderiya.png",
  messages: [
    { text: "you up?", side: "left", typingFrames: 50, delay: 30 },
    { text: "for you, always 😏", side: "right", typingFrames: 60, delay: 150 },
    { text: "i miss you", side: "left", typingFrames: 55, delay: 290 },
    { text: "come over?", side: "right", typingFrames: 48, delay: 430 },
    {
      text: "already on my way ❤️",
      side: "left",
      typingFrames: 58,
      delay: 560,
    },
  ],
  theme: "light",
};

export const messageBubblesInfo: CompositionInfo<MessageBubblesProps> = {
  id: "MessageBubbles",
  title: "Message Bubbles",
  description:
    "An animated iMessage-style chat conversation. Edit the contact and messages below.",
  durationInFrames: MESSAGE_BUBBLES_DURATION,
  fps: MESSAGE_BUBBLES_FPS,
  width: MESSAGE_BUBBLES_WIDTH,
  height: MESSAGE_BUBBLES_HEIGHT,
  defaultProps: messageBubblesDefaultProps,
  brandMode: "locked",
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
  ],
};
