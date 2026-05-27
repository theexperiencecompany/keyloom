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
}) => {
  const frame = useDesignFrame();
  const items = buildItems(messages, frame, leftAvatar, rightAvatar);

  return (
    <ChatFill
      backdrop="#1E1F22"
      chromeColor="#1E1F22"
      scale={scale}
      orientation={orientation}
    >
      <ChatDemo platform="discord" title={contactName} messages={items} />
    </ChatFill>
  );
};
