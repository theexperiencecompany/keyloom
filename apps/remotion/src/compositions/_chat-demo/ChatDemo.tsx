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
import { type ClipOverrides, ov } from "./overrides";
import { DiscordDemo } from "./platforms/discord";
import { SlackDemo } from "./platforms/slack";
import { TelegramDemo } from "./platforms/telegram";
import { WhatsAppDemo } from "./platforms/whatsapp";
import type { ChatDemoProps } from "./types";

export { asset } from "../../lib/asset";
export {
  BubbleEnter,
  BubbleReveal,
  CurvedBubble,
  DoodleTiles,
  DotsToMessage,
  ImageBubble,
  ReadReceipt,
  TypingBubble,
  TypingDots,
} from "./bubbles";
export { curvedThread, groupByAuthor } from "./threads";
export type { ChatDemoProps, ChatMessageItem, ChatPlatform } from "./types";
export { type ClipOverrides, DEFAULT_AVATAR, ov };

// iMessage bubble palette.
//  • Sent — solid blue, white text.
//  • Received — #E9E9EB in light, #2a272a in dark.
export const IMESSAGE_GRADIENT = "#2d90fa";
export const IMESSAGE_TAIL_ME_COLOR = "#2d90fa";
export const IMESSAGE_THEM_BG_LIGHT = "#E9E9EB";
export const IMESSAGE_THEM_BG_DARK = "#2a272a";

export function ChatDemo({
  platform,
  messages,
  title,
  subtitle,
  headerAvatar,
  showComposer = true,
  theme,
  className,
  clipBackground,
  clipColor,
  clipFontFamily,
  clipAccent,
}: ChatDemoProps) {
  const clip: ClipOverrides = {
    background: clipBackground,
    color: clipColor,
    fontFamily: clipFontFamily,
    accent: clipAccent,
  };
  switch (platform) {
    case "whatsapp":
      return (
        <WhatsAppDemo
          messages={messages}
          title={title}
          subtitle={subtitle}
          headerAvatar={headerAvatar ?? DEFAULT_AVATAR}
          showComposer={showComposer}
          className={className}
          clip={clip}
        />
      );
    case "slack":
      return (
        <SlackDemo
          messages={messages}
          title={title}
          subtitle={subtitle}
          showComposer={showComposer}
          theme={theme ?? "light"}
          className={className}
          clip={clip}
        />
      );
    case "discord":
      return (
        <DiscordDemo
          messages={messages}
          title={title}
          subtitle={subtitle}
          showComposer={showComposer}
          className={className}
          clip={clip}
        />
      );
    case "telegram":
      return (
        <TelegramDemo
          messages={messages}
          title={title}
          subtitle={subtitle}
          headerAvatar={headerAvatar ?? DEFAULT_AVATAR}
          showComposer={showComposer}
          className={className}
          clip={clip}
        />
      );
  }
}
