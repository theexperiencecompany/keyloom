"use client";

/**
 * Shared chat renderer behind the WhatsApp / Telegram / Slack / Discord
 * compositions. This module is the dispatcher + public surface: the shared
 * types live in `./types`, the bubble primitives in `./bubbles`, thread
 * grouping helpers in `./threads`, and each platform's chrome in
 * `./platforms/*`. Everything a caller needs is re-exported from here so the
 * import path `../_chat-demo/ChatDemo` stays stable.
 */

import { DEFAULT_AVATAR } from "./defaults";
import { DiscordDemo } from "./platforms/discord";
import { SlackDemo } from "./platforms/slack";
import { TelegramDemo } from "./platforms/telegram";
import { WhatsAppDemo } from "./platforms/whatsapp";
import type { ChatDemoProps } from "./types";

export { asset } from "../../lib/asset";
export {
  BubbleEnter,
  BubbleReveal,
  DotsToMessage,
  ImageBubble,
  ReadReceipt,
  TypingBubble,
} from "./bubbles";
export type { ChatMessageItem } from "./types";

// iMessage bubble palette.
//  • Sent — solid blue, white text.
//  • Received — #E9E9EB in light, #2a272a in dark.
export const IMESSAGE_GRADIENT = "#2d90fa";
export const IMESSAGE_THEM_BG_LIGHT = "#E9E9EB";
export const IMESSAGE_THEM_BG_DARK = "#2a272a";

export function ChatDemo({
  platform,
  messages,
  title,
  headerAvatar,
  theme,
  clip,
}: ChatDemoProps) {
  switch (platform) {
    case "whatsapp":
      return (
        <WhatsAppDemo
          messages={messages}
          title={title}
          headerAvatar={headerAvatar ?? DEFAULT_AVATAR}
          clip={clip}
        />
      );
    case "slack":
      return (
        <SlackDemo
          messages={messages}
          title={title}
          theme={theme ?? "light"}
          clip={clip}
        />
      );
    case "discord":
      return <DiscordDemo messages={messages} title={title} clip={clip} />;
    case "telegram":
      return (
        <TelegramDemo
          messages={messages}
          title={title}
          headerAvatar={headerAvatar ?? DEFAULT_AVATAR}
          clip={clip}
        />
      );
  }
}
