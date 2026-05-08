"use client";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { ChatMessage } from "../../editors/types";

export type SlackMessagesProps = {
  contactName: string;
  messages: ChatMessage[];
  theme: "light" | "dark";
};

const ROW_SHIFT = 130;
const BASE_BOTTOM = 100;
const SIDE_PADDING = 56;

const COLOR_LEFT = "#4A154B";
const COLOR_RIGHT = "#1264A3";

type Palette = {
  bg: string;
  border: string;
  channelText: string;
  channelHash: string;
  senderText: string;
  bodyText: string;
  metaText: string;
  typingText: string;
  typingDot: string;
  typingStrong: string;
};

function getPalette(theme: "light" | "dark"): Palette {
  if (theme === "dark") {
    return {
      bg: "#1A1D21",
      border: "rgba(255,255,255,0.08)",
      channelText: "#FFFFFF",
      channelHash: "#9A9B9D",
      senderText: "#FFFFFF",
      bodyText: "#D1D2D3",
      metaText: "#9A9B9D",
      typingText: "#9A9B9D",
      typingDot: "#9A9B9D",
      typingStrong: "#FFFFFF",
    };
  }
  return {
    bg: "#FFFFFF",
    border: "#e8e8e8",
    channelText: "#1d1c1d",
    channelHash: "#616061",
    senderText: "#1d1c1d",
    bodyText: "#1d1c1d",
    metaText: "#616061",
    typingText: "#616061",
    typingDot: "#616061",
    typingStrong: "#1d1c1d",
  };
}

export const SlackMessages: React.FC<SlackMessagesProps> = ({
  contactName,
  messages,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = getPalette(theme);

  return (
    <AbsoluteFill
      style={{
        background: palette.bg,
        fontFamily:
          "Lato, -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif",
        color: palette.bodyText,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header
        name={contactName}
        frame={frame}
        fps={fps}
        palette={palette}
      />
      <Conversation
        frame={frame}
        fps={fps}
        messages={messages}
        contactName={contactName}
        palette={palette}
      />
    </AbsoluteFill>
  );
};

function Header({
  name,
  frame,
  fps,
  palette,
}: {
  name: string;
  frame: number;
  fps: number;
  palette: Palette;
}) {
  const enter = spring({
    frame,
    fps,
    config: { damping: 22, stiffness: 90 },
  });
  return (
    <div
      style={{
        padding: "20px 28px",
        borderBottom: `1px solid ${palette.border}`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        opacity: enter,
        transform: `translateY(${(1 - enter) * -8}px)`,
      }}
    >
      <span
        style={{
          fontSize: 28,
          color: palette.channelHash,
          fontWeight: 400,
          marginRight: 4,
        }}
      >
        #
      </span>
      <span
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: palette.channelText,
          letterSpacing: "-0.01em",
        }}
      >
        {name.toLowerCase().replace(/\s+/g, "-")}
      </span>
    </div>
  );
}

function Conversation({
  frame,
  fps,
  messages,
  contactName,
  palette,
}: {
  frame: number;
  fps: number;
  messages: ChatMessage[];
  contactName: string;
  palette: Palette;
}) {
  const last = messages[messages.length - 1];
  const lastLocal = last ? frame - last.delay : -1;
  const showTyping = last && lastLocal >= 0 && lastLocal < last.typingFrames;
  const typingName = last?.side === "right" ? "you" : contactName;

  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      {messages.map((msg, i) => (
        <MessageRow
          key={i}
          msg={msg}
          index={i}
          messages={messages}
          frame={frame}
          fps={fps}
          contactName={contactName}
          palette={palette}
        />
      ))}
      {showTyping ? (
        <TypingIndicator
          name={typingName}
          frame={frame}
          fps={fps}
          palette={palette}
        />
      ) : null}
    </div>
  );
}

function MessageRow({
  msg,
  index,
  messages,
  frame,
  fps,
  contactName,
  palette,
}: {
  msg: ChatMessage;
  index: number;
  messages: ChatMessage[];
  frame: number;
  fps: number;
  contactName: string;
  palette: Palette;
}) {
  const local = frame - msg.delay;
  if (local < msg.typingFrames) return null;
  const localBubble = local - msg.typingFrames;

  let stackOffset = 0;
  for (let j = index + 1; j < messages.length; j++) {
    const newerLocal = frame - messages[j]!.delay;
    if (newerLocal < 0) continue;
    const progress = spring({
      frame: newerLocal,
      fps,
      config: { damping: 20, stiffness: 120, mass: 0.7 },
    });
    stackOffset += progress;
  }

  const bottom = BASE_BOTTOM + stackOffset * ROW_SHIFT;
  const isRight = msg.side === "right";
  const senderName = isRight ? "you" : contactName;
  const accent = isRight ? COLOR_RIGHT : COLOR_LEFT;

  const pop = spring({
    frame: localBubble,
    fps,
    config: { damping: 14, stiffness: 160, mass: 0.55 },
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom,
        left: SIDE_PADDING,
        right: SIDE_PADDING,
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        opacity: pop,
        transform: `translateY(${(1 - pop) * 18}px)`,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 8,
          background: accent,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 700,
          flexShrink: 0,
          letterSpacing: "-0.01em",
        }}
      >
        {senderName.slice(0, 1).toUpperCase()}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 2,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: palette.senderText,
              letterSpacing: "-0.005em",
            }}
          >
            {senderName}
          </span>
          <span style={{ fontSize: 14, color: palette.metaText }}>now</span>
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 400,
            color: palette.bodyText,
            lineHeight: 1.35,
            wordWrap: "break-word",
          }}
        >
          {msg.text}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({
  name,
  frame,
  fps,
  palette,
}: {
  name: string;
  frame: number;
  fps: number;
  palette: Palette;
}) {
  const enter = spring({
    frame: frame - 2,
    fps,
    config: { damping: 14, stiffness: 160 },
  });
  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        left: SIDE_PADDING,
        right: SIDE_PADDING,
        display: "flex",
        gap: 8,
        alignItems: "center",
        opacity: enter,
        fontSize: 16,
        color: palette.typingText,
        fontStyle: "italic",
      }}
    >
      {[0, 1, 2].map((i) => {
        const phase = (frame + i * 5) / 7;
        const dotOpacity = 0.45 + Math.sin(phase) * 0.3;
        return (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: palette.typingDot,
              opacity: dotOpacity,
            }}
          />
        );
      })}
      <span style={{ marginLeft: 4 }}>
        <strong style={{ color: palette.typingStrong, fontWeight: 700 }}>
          {name}
        </strong>{" "}
        is typing
      </span>
    </div>
  );
}
