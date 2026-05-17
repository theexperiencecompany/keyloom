import type { CompositionInfo } from "../../schema";
import type { TelegramMessagesProps } from "./TelegramMessages";

export const TELEGRAM_MESSAGES_DURATION = 660;
export const TELEGRAM_MESSAGES_FPS = 60;
export const TELEGRAM_MESSAGES_WIDTH = 1280;
export const TELEGRAM_MESSAGES_HEIGHT = 720;

export const telegramMessagesDefaultProps: TelegramMessagesProps = {
  contactName: "sanku",
  contactAvatar: "https://avatars.githubusercontent.com/aryanranderiya?s=200",
  messages: [
    { text: "you free tonight?", side: "left", typingFrames: 50, delay: 30 },
    { text: "yeah, what's up", side: "right", typingFrames: 55, delay: 150 },
    {
      text: "wanna watch the new episode?",
      side: "left",
      typingFrames: 60,
      delay: 270,
    },
    { text: "always 🍿", side: "right", typingFrames: 48, delay: 400 },
    {
      text: "coming over in 10",
      side: "left",
      typingFrames: 55,
      delay: 530,
    },
  ],
  orientation: "landscape",
  scale: 1.6,
};

export const telegramMessagesInfo: CompositionInfo<TelegramMessagesProps> = {
  id: "TelegramMessages",
  title: "Telegram Messages",
  description:
    "An animated Telegram-style chat conversation with tailed bubbles, in-bubble timestamps, and the signature blue check marks.",
  durationInFrames: TELEGRAM_MESSAGES_DURATION,
  fps: TELEGRAM_MESSAGES_FPS,
  width: TELEGRAM_MESSAGES_WIDTH,
  height: TELEGRAM_MESSAGES_HEIGHT,
  defaultProps: telegramMessagesDefaultProps,
  brandMode: "locked",
  phoneFitMode: "cover",
  fields: [
    { kind: "text", key: "contactName", label: "Contact name" },
    { kind: "text", key: "contactAvatar", label: "Avatar URL" },
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
};
