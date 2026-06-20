import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import type { ChatMessage } from "../../editors/types";
import { useDesignFrame } from "../../use-design-frame";
import { ChatDemo, type ChatMessageItem } from "../_chat-demo/ChatDemo";
import { ChatFill } from "../_chat-demo/ChatFill";

export type TelegramMessagesProps = {
  contactName: string;
  contactAvatar?: string;
  messages: ChatMessage[];
  orientation?: "landscape" | "portrait";
  scale?: number;
  /** Universal Style — background (chat wallpaper), text, font, accent. */
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

export const TelegramMessages: React.FC<TelegramMessagesProps> = ({
  contactName,
  contactAvatar = "https://avatars.githubusercontent.com/aryanranderiya?s=200",
  messages,
  orientation = "landscape",
  scale = 2,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const items = buildItems(messages, frame);

  // Authentic Telegram defaults; clipStyle overrides the chat wallpaper,
  // primary text, font, and the Telegram-blue accent (header/composer icons).
  const s = resolveClipStyle(clipStyle, {
    background: "#2B78CD",
    color: "#060606",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
    accent: "#037EE5",
  });

  return (
    <ChatFill
      backdrop={s.background}
      chromeColor="#FFFFFF"
      scale={scale}
      orientation={orientation}
    >
      <ChatDemo
        platform="telegram"
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
