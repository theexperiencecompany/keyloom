import { useCurrentFrame } from "remotion";
import type { ChatMessage } from "../../editors/types";
import { ChatDemo, type ChatMessageItem } from "../_chat-demo/ChatDemo";
import { ChatFill } from "../_chat-demo/ChatFill";

export type DiscordMessagesProps = {
  contactName: string;
  messages: ChatMessage[];
};

const LEFT_AVATAR = "https://github.com/aryanranderiya.png";
const RIGHT_AVATAR = "gaia-glow.png";

function buildItems(messages: ChatMessage[], frame: number): ChatMessageItem[] {
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
      avatar: isMe ? RIGHT_AVATAR : LEFT_AVATAR,
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
}) => {
  const frame = useCurrentFrame();
  const items = buildItems(messages, frame);

  return (
    <ChatFill backdrop="#1E1F22" scale={1.5}>
      <ChatDemo platform="discord" title={contactName} messages={items} />
    </ChatFill>
  );
};
