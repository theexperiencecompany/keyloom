import type { CompositionInfo } from "../../schema";
import type { DiscordMessagesProps } from "./DiscordMessages";

export const DISCORD_MESSAGES_DURATION = 780;
export const DISCORD_MESSAGES_FPS = 60;
export const DISCORD_MESSAGES_WIDTH = 1280;
export const DISCORD_MESSAGES_HEIGHT = 720;

export const discordMessagesDefaultProps: DiscordMessagesProps = {
  contactName: "general",
  messages: [
    {
      text: "anyone playing tonight?",
      side: "left",
      typingFrames: 50,
      delay: 30,
    },
    {
      text: "im down",
      side: "right",
      typingFrames: 40,
      delay: 150,
    },
    {
      text: "ranked or casual?",
      side: "left",
      typingFrames: 55,
      delay: 290,
    },
    {
      text: "ranked. lets go",
      side: "right",
      typingFrames: 50,
      delay: 430,
    },
    {
      text: "joining vc",
      side: "left",
      typingFrames: 45,
      delay: 560,
    },
  ],
  theme: "dark",
};

export const discordMessagesInfo: CompositionInfo<DiscordMessagesProps> = {
  id: "DiscordMessages",
  title: "Discord Messages",
  description:
    "An animated Discord-style channel conversation in the dark theme with colored usernames and typing indicator.",
  durationInFrames: DISCORD_MESSAGES_DURATION,
  fps: DISCORD_MESSAGES_FPS,
  width: DISCORD_MESSAGES_WIDTH,
  height: DISCORD_MESSAGES_HEIGHT,
  defaultProps: discordMessagesDefaultProps,
  fields: [
    { kind: "text", key: "contactName", label: "Channel name" },
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
