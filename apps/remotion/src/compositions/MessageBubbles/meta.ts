import type { CompositionInfo } from "../../schema";
import type { MessageBubblesProps } from "./MessageBubbles";

export const MESSAGE_BUBBLES_DURATION = 660;
export const MESSAGE_BUBBLES_FPS = 60;
export const MESSAGE_BUBBLES_WIDTH = 1280;
export const MESSAGE_BUBBLES_HEIGHT = 720;

export const messageBubblesDefaultProps: MessageBubblesProps = {
  contactName: "sanku",
  contactAvatar: "https://avatars.githubusercontent.com/aryanranderiya?s=200",
  messages: [
    { text: "hey, you up?", side: "left", typingFrames: 50, delay: 30 },
    { text: "yeah whats up", side: "right", typingFrames: 55, delay: 150 },
    { text: "wanna grab food?", side: "right", typingFrames: 55, delay: 270 },
    { text: "always 🍕", side: "left", typingFrames: 50, delay: 400 },
    { text: "on my way ❤️", side: "right", typingFrames: 55, delay: 530 },
    { text: "wait where r u?", side: "left", typingFrames: 50, delay: 670 },
    { text: "almost there 🚗", side: "right", typingFrames: 55, delay: 800 },
    { text: "okok i see you 👀", side: "left", typingFrames: 50, delay: 930 },
    { text: "🏃💨", side: "right", typingFrames: 40, delay: 1050 },
    { text: "you're the best 😭", side: "left", typingFrames: 50, delay: 1170 },
  ],
  orientation: "portrait",
  scale: 2,
  backgroundImage: "",
  liquidGlass: true,
  liquidAmount: 0,
  theme: "dark",
  showKeyboard: true,
};

export const messageBubblesInfo: CompositionInfo<MessageBubblesProps> = {
  id: "MessageBubbles",
  category: "social",
  title: "Message Bubbles",
  description:
    "An animated iMessage-style chat conversation with grouped bubble corners, tails, and spring-stacked rows.",
  durationInFrames: MESSAGE_BUBBLES_DURATION,
  fps: MESSAGE_BUBBLES_FPS,
  width: MESSAGE_BUBBLES_WIDTH,
  height: MESSAGE_BUBBLES_HEIGHT,
  defaultProps: messageBubblesDefaultProps,
  brandMode: "locked",
  phoneFitMode: "cover",
  // Curated skins — first entry is the default look. Locked compositions
  // still get the Theme picker (themes are hand-built, not free recoloring).
  themes: [
    { id: "imessage", label: "iMessage" },
    {
      id: "glass",
      label: "Liquid Glass",
      description: "Frosted translucent bubbles over a vivid gradient",
    },
  ],
  fields: [
    { kind: "text", key: "contactName", label: "Contact name" },
    { kind: "text", key: "contactAvatar", label: "Avatar URL" },
    {
      kind: "image",
      key: "backgroundImage",
      label: "Background wallpaper",
      placeholder: "images/... or https://...",
    },
    { kind: "switch", key: "liquidGlass", label: "Liquid glass (WebGL)" },
    { kind: "switch", key: "showKeyboard", label: "Keyboard (typing)" },
    {
      kind: "select",
      key: "theme",
      label: "Appearance",
      options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ],
    },
    { kind: "chat", key: "messages", label: "Messages" },
    {
      kind: "select",
      key: "orientation",
      label: "Orientation",
      options: [
        { value: "landscape", label: "Landscape" },
        { value: "portrait", label: "Portrait (phone)" },
      ],
    },
    {
      kind: "number",
      key: "scale",
      label: "UI scale (landscape)",
      min: 0.5,
      max: 3,
    },
  ],
  // Grow the video to fit the conversation: the last bubble lands at
  // delay + typingFrames, so end there plus a ~1.2s hold. Without this, adding
  // messages past the default ~11s (e.g. a final photo) would be cut off and
  // never appear.
  calculateMetadata: ({ props }) => {
    const msgs = Array.isArray(props.messages) ? props.messages : [];
    let lastEnd = 0;
    for (const m of msgs) {
      const end = (m.delay ?? 0) + (m.typingFrames ?? 0);
      if (end > lastEnd) lastEnd = end;
    }
    const HOLD = Math.round(MESSAGE_BUBBLES_FPS * 1.2);
    return {
      durationInFrames: Math.max(MESSAGE_BUBBLES_DURATION, lastEnd + HOLD),
    };
  },
};
