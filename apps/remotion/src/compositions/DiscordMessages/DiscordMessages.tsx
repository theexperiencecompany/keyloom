"use client";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { ChatMessage } from "../../editors/types";

export type DiscordMessagesProps = {
  contactName: string;
  messages: ChatMessage[];
  theme: "light" | "dark";
};

const ROW_SHIFT = 130;
const BASE_BOTTOM = 100;
const SIDE_PADDING = 56;

const COLOR_LEFT = "#5865F2";
const COLOR_RIGHT = "#ED4245";

type Palette = {
  bg: string;
  headerBg: string;
  headerBorder: string;
  channelHash: string;
  channelText: string;
  bodyText: string;
  metaText: string;
  typingText: string;
  typingDot: string;
  typingStrong: string;
};

function getPalette(theme: "light" | "dark"): Palette {
  if (theme === "light") {
    return {
      bg: "#FFFFFF",
      headerBg: "#F2F3F5",
      headerBorder: "#E3E5E8",
      channelHash: "#6D6F78",
      channelText: "#060607",
      bodyText: "#2E3338",
      metaText: "#5C5E66",
      typingText: "#5C5E66",
      typingDot: "#5C5E66",
      typingStrong: "#060607",
    };
  }
  return {
    bg: "#313338",
    headerBg: "#2b2d31",
    headerBorder: "#1f2023",
    channelHash: "#80848e",
    channelText: "#f2f3f5",
    bodyText: "#dbdee1",
    metaText: "#80848e",
    typingText: "#b5bac1",
    typingDot: "#b5bac1",
    typingStrong: "#f2f3f5",
  };
}

export const DiscordMessages: React.FC<DiscordMessagesProps> = ({
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
          "'gg sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
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
        borderBottom: `1px solid ${palette.headerBorder}`,
        background: palette.headerBg,
        display: "flex",
        alignItems: "center",
        gap: 10,
        opacity: enter,
        transform: `translateY(${(1 - enter) * -8}px)`,
        boxShadow: "0 1px 0 rgba(4,4,5,0.2)",
      }}
    >
      <span
        style={{
          fontSize: 30,
          color: palette.channelHash,
          fontWeight: 600,
          marginRight: 4,
        }}
      >
        #
      </span>
      <span
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: palette.channelText,
          letterSpacing: "-0.005em",
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
        gap: 16,
        alignItems: "flex-start",
        opacity: pop,
        transform: `translateY(${(1 - pop) * 18}px)`,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: accent,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {senderName.slice(0, 1).toUpperCase()}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            marginBottom: 2,
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: accent,
              letterSpacing: "-0.005em",
            }}
          >
            {senderName}
          </span>
          <span style={{ fontSize: 14, color: palette.metaText }}>
            Today at 14:32
          </span>
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 400,
            color: palette.bodyText,
            lineHeight: 1.375,
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
        fontSize: 15,
        color: palette.typingText,
      }}
    >
      {[0, 1, 2].map((i) => {
        const phase = (frame + i * 5) / 7;
        const yBob = Math.sin(phase) * 3;
        return (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: palette.typingDot,
              transform: `translateY(${-Math.abs(yBob)}px)`,
              opacity: 0.7,
            }}
          />
        );
      })}
      <span style={{ marginLeft: 6 }}>
        <strong style={{ color: palette.typingStrong, fontWeight: 600 }}>
          {name}
        </strong>{" "}
        is typing…
      </span>
    </div>
  );
}
