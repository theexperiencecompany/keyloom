"use client";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import type { ChatMessage } from "../../editors/types";
import { useDesignFrame } from "../../use-design-frame";
import { ChatDemo, type ChatMessageItem } from "../_chat-demo/ChatDemo";
import { ChatFill } from "../_chat-demo/ChatFill";

export type SlackMessagesProps = {
  contactName: string;
  messages: ChatMessage[];
  theme: "light" | "dark";
  orientation?: "landscape" | "portrait";
  scale?: number;
  leftAvatar?: string;
  rightAvatar?: string;
  /** Universal Style — background (chat screen), text, font, accent. */
  clipStyle?: ClipStyle;
};

const DEFAULT_LEFT_AVATAR = "images/logos/aryan-avatar.png";
const DEFAULT_RIGHT_AVATAR = "gaia-glow.png";

function buildItems(
  messages: ChatMessage[],
  frame: number,
  leftAvatar: string,
  rightAvatar: string,
): ChatMessageItem[] {
  const out: ChatMessageItem[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]!;
    if (frame < m.delay) continue;
    const local = frame - m.delay;
    const isTyping = local < m.typingFrames;
    const isGaia = m.side === "right";
    out.push({
      id: i,
      // Slack is a channel — every message is left-aligned next to its
      // author's avatar, regardless of who sent it. `from` here only drives
      // bubble alignment, so it's always "them".
      from: "them",
      author: isGaia ? "GAIA" : "Aryan",
      avatar: isGaia ? rightAvatar : leftAvatar,
      text: m.text,
      typing: isTyping,
      enterFrames: local,
    });
  }
  return out;
}

export const SlackMessages: React.FC<SlackMessagesProps> = ({
  contactName,
  messages,
  theme,
  orientation = "landscape",
  scale = 2.5,
  leftAvatar = DEFAULT_LEFT_AVATAR,
  rightAvatar = DEFAULT_RIGHT_AVATAR,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const items = buildItems(messages, frame, leftAvatar, rightAvatar);

  // Slack is a channel view (no outgoing bubble). theme decides the DEFAULT
  // background/text; a clipStyle override wins. Accent has no single clean
  // element here, so the aubergine brand color is left to authentic chrome.
  const themeBg = theme === "dark" ? "#1A1D21" : "#FFFFFF";
  const s = resolveClipStyle(clipStyle, {
    background: themeBg,
    color: theme === "dark" ? "#D1D2D3" : "#1D1C1D",
    fontFamily:
      '"Slack-Lato", "Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    accent: "#4a154b",
  });

  return (
    <ChatFill
      backdrop={s.background}
      chromeColor={themeBg}
      scale={scale}
      orientation={orientation}
    >
      <ChatDemo
        platform="slack"
        title={contactName}
        theme={theme}
        messages={items}
        clipBackground={s.background}
        clipColor={s.color}
        clipFontFamily={s.fontFamily}
      />
    </ChatFill>
  );
};
