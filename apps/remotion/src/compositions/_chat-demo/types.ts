import type { ClipStyleDefaults } from "../../clip-style";

export type ChatPlatform = "whatsapp" | "slack" | "discord" | "telegram";

export interface ChatMessageItem {
  id?: string | number;
  from?: "me" | "them";
  text?: string;
  /** Photo attachment (data URL or asset path) — renders an image bubble. */
  image?: string;
  time?: string;
  author?: string;
  authorColor?: string;
  avatar?: string;
  typing?: boolean;
  /** Frames since this message first became visible. Drives the pop-in animation. */
  enterFrames?: number;
  /**
   * Frames since the typing indicator swapped to the real message. Drives the
   * iMessage "morph": the bubble inflates from the tail corner and the row's
   * height grows from the dots bubble to the full message. Only set for
   * messages that actually showed a typing phase.
   */
  revealFrames?: number;
}

export interface ChatDemoProps {
  platform: ChatPlatform;
  messages: ChatMessageItem[];
  title?: string;
  headerAvatar?: string;
  theme?: "light" | "dark";
  /**
   * Universal Style, already resolved against the composition's defaults.
   * Each platform maps `background` to the chat-screen background, `color` to
   * the primary message text, `fontFamily` to the root font, and `accent` to
   * its main brand accent, such as the outgoing bubble, send button or header
   * tint.
   */
  clip: ClipStyleDefaults;
}
