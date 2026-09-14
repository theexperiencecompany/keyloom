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
  status?: "sent" | "delivered" | "read";
  reactions?: { emoji: string; count: number }[];
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
  subtitle?: string;
  headerAvatar?: string;
  showComposer?: boolean;
  theme?: "light" | "dark";
  className?: string;
  /**
   * Universal Style overrides forwarded by the (now unlocked) chat
   * compositions. Each platform renderer applies the single clean mapping that
   * fits its layout: `clipBackground` → chat-screen background, `clipColor` →
   * primary message text, `clipFontFamily` → root font, `clipAccent` → the one
   * obvious brand accent (outgoing bubble / send button / header tint). Unset
   * (undefined) means keep the authentic default.
   */
  clipBackground?: string;
  clipColor?: string;
  clipFontFamily?: string;
  clipAccent?: string;
}
