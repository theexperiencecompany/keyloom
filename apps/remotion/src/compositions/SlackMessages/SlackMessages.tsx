"use client";
import {} from "remotion";
import type { ChatMessage } from "../../editors/types";
import { useDesignFrame } from "../../use-design-frame";
import { ChatDemo, type ChatMessageItem } from "../_chat-demo/ChatDemo";
import { ChatFill } from "../_chat-demo/ChatFill";

export type SlackMessagesProps = {
  contactName: string;
  messages: ChatMessage[];
  theme: "light" | "dark";
};

const LEFT_AVATAR = "default-avatar.png";
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
      avatar: isMe ? RIGHT_AVATAR : LEFT_AVATAR,
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
}) => {
  const frame = useDesignFrame();
  const items = buildItems(messages, frame);

  return (
    <ChatFill backdrop={theme === "dark" ? "#1A1D21" : "#FFFFFF"} scale={1.5}>
      <ChatDemo
        platform="slack"
        title={contactName}
        theme={theme}
        messages={items}
      />
    </ChatFill>
  );
};
