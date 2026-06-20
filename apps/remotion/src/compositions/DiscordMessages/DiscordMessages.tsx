import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import type { ChatMessage } from "../../editors/types";
import { useDesignFrame } from "../../use-design-frame";
import { ChatDemo, type ChatMessageItem } from "../_chat-demo/ChatDemo";
import { ChatFill } from "../_chat-demo/ChatFill";

export type DiscordMessagesProps = {
  contactName: string;
  messages: ChatMessage[];
  orientation?: "landscape" | "portrait";
  scale?: number;
  leftAvatar?: string;
  rightAvatar?: string;
  /** Universal Style — background (chat screen), text, font, accent. */
  clipStyle?: ClipStyle;
};

const DEFAULT_LEFT_AVATAR = "default-avatar.png";
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
    const isMe = m.side === "right";
    out.push({
      id: i,
      from: isMe ? "me" : "them",
      author: isMe ? "GAIA" : "Aryan",
      authorColor: isMe ? "#9CC3FF" : "#F47FFF",
      avatar: isMe ? rightAvatar : leftAvatar,
      text: m.text,
      typing: isTyping,
      time: "now",
      enterFrames: local,
    });
  }
  return out;
}

export const DiscordMessages: React.FC<DiscordMessagesProps> = ({
  contactName,
  messages,
  orientation = "landscape",
  scale = 2,
  leftAvatar = DEFAULT_LEFT_AVATAR,
  rightAvatar = DEFAULT_RIGHT_AVATAR,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const items = buildItems(messages, frame, leftAvatar, rightAvatar);

  // Authentic Discord dark theme defaults; clipStyle overrides the channel
  // background, primary text, font, and the blurple accent (gift icon).
  const s = resolveClipStyle(clipStyle, {
    background: "#1E1F22",
    color: "#DBDEE1",
    fontFamily:
      '"gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
    accent: "#5865f2",
  });

  return (
    <ChatFill
      backdrop={s.background}
      chromeColor="#1E1F22"
      scale={scale}
      orientation={orientation}
    >
      <ChatDemo
        platform="discord"
        title={contactName}
        messages={items}
        clipBackground={s.background}
        clipColor={s.color}
        clipFontFamily={s.fontFamily}
        clipAccent={s.accent}
      />
    </ChatFill>
  );
};
