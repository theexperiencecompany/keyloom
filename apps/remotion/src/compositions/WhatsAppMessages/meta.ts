import type { CompositionInfo } from "../../schema";
import type { WhatsAppMessagesProps } from "./WhatsAppMessages";

export const WHATSAPP_MESSAGES_DURATION = 660;
export const WHATSAPP_MESSAGES_FPS = 60;
export const WHATSAPP_MESSAGES_WIDTH = 1280;
export const WHATSAPP_MESSAGES_HEIGHT = 720;

export const whatsappMessagesDefaultProps: WhatsAppMessagesProps = {
  contactName: "sanku",
  contactAvatar: "https://github.com/aryanranderiya.png",
  messages: [
    { text: "hey, you up?", side: "left", typingFrames: 50, delay: 30 },
    { text: "yeah whats up", side: "right", typingFrames: 55, delay: 150 },
    { text: "wanna grab food?", side: "left", typingFrames: 55, delay: 290 },
    { text: "always 🍕", side: "right", typingFrames: 48, delay: 430 },
    {
      text: "on my way 🛵",
      side: "left",
      typingFrames: 50,
      delay: 560,
    },
  ],
  theme: "light",
};

export const whatsappMessagesInfo: CompositionInfo<WhatsAppMessagesProps> = {
  id: "WhatsAppMessages",
  title: "WhatsApp Messages",
  description:
    "An animated WhatsApp-style chat conversation with green bubbles, read receipts, and stacking spring physics.",
  durationInFrames: WHATSAPP_MESSAGES_DURATION,
  fps: WHATSAPP_MESSAGES_FPS,
  width: WHATSAPP_MESSAGES_WIDTH,
  height: WHATSAPP_MESSAGES_HEIGHT,
  defaultProps: whatsappMessagesDefaultProps,
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
