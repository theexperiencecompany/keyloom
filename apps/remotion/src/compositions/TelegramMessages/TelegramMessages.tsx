import {} from "remotion";
import type { ChatMessage } from "../../editors/types";
import { useDesignFrame } from "../../use-design-frame";
import { ChatDemo, type ChatMessageItem } from "../_chat-demo/ChatDemo";
import { ChatFill } from "../_chat-demo/ChatFill";

export type TelegramMessagesProps = {
  contactName: string;
  contactAvatar?: string;
  messages: ChatMessage[];
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
  contactAvatar = "https://github.com/aryanranderiya.png",
  messages,
}) => {
  const frame = useDesignFrame();
  const items = buildItems(messages, frame);

  return (
    <ChatFill backdrop="#2B78CD" scale={1.6}>
      <ChatDemo
        platform="telegram"
        title={contactName}
        headerAvatar={contactAvatar}
        messages={items}
      />
    </ChatFill>
  );
};
