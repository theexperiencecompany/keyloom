"use client";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import type { ChatMessage } from "../../editors/types";
import { useDesignFrame } from "../../use-design-frame";
import { ChatDemo, type ChatMessageItem } from "../_chat-demo/ChatDemo";
import { ChatFill } from "../_chat-demo/ChatFill";

export type WhatsAppMessagesProps = {
  contactName: string;
  contactAvatar?: string;
  messages: ChatMessage[];
  theme: "light" | "dark";
  orientation?: "landscape" | "portrait";
  /** How much the chat UI is scaled up inside the canvas (landscape only). */
  scale?: number;
  /** Universal Style — background (chat screen), text, font, accent. */
  clipStyle?: ClipStyle;
};

function buildItems(messages: ChatMessage[], frame: number): ChatMessageItem[] {
  const out: ChatMessageItem[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]!;
    if (frame < m.delay) continue;
    const local = frame - m.delay;
    const isTyping = local < m.typingFrames;
    out.push({
      id: i,
      from: m.side === "right" ? "me" : "them",
      text: m.text,
      typing: isTyping,
      enterFrames: local,
    });
  }
  return out;
}

export const WhatsAppMessages: React.FC<WhatsAppMessagesProps> = ({
  contactName,
  contactAvatar = "https://avatars.githubusercontent.com/aryanranderiya?s=200",
  messages,
  theme: _theme,
  orientation = "landscape",
  scale = 2,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const items = buildItems(messages, frame);

  // WhatsApp's chat screen is the full-screen background here. Authentic
  // defaults; clipStyle overrides feed the shared ChatDemo so the universal
  // Style controls (Background / Text / Font / Accent) apply on top of the
  // signature green sent bubble.
  const s = resolveClipStyle(clipStyle, {
    background: "#EFEFF4",
    color: "#0b141a",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    accent: "#25d366",
  });

  return (
    <ChatFill
      backdrop={s.background}
      chromeColor="#F6F6F6"
      scale={scale}
      orientation={orientation}
    >
      <ChatDemo
        platform="whatsapp"
        title={contactName}
        headerAvatar={contactAvatar}
        messages={items}
        clipBackground={s.background}
        clipColor={s.color}
        clipFontFamily={s.fontFamily}
        clipAccent={s.accent}
      />
    </ChatFill>
  );
};
