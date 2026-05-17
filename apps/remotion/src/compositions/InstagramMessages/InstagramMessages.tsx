"use client";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Img,
  Sequence,
  spring,
  staticFile,
  useVideoConfig,
} from "remotion";
import type { ChatMessage } from "../../editors/types";
import { proxyExternalImg } from "../../proxy-image";
import { useSafeArea } from "../../safe-area";
import { snap } from "../../snap";
import { useDesignFrame } from "../../use-design-frame";

export type InstagramMessagesProps = {
  contactName: string;
  contactAvatar?: string;
  messages: ChatMessage[];
  theme: "light" | "dark";
  orientation?: "landscape" | "portrait";
};

// 9:19.5 — modern iPhone screen aspect ratio.
const PORTRAIT_ASPECT = "9 / 19.5";

const ROW_GAP = 18;
const BOTTOM_PADDING = 36;
const COMPOSER_HEIGHT = 96;
const HEADER_HEIGHT = 110;
const SIDE_PADDING = 48;

const SENT_BG = "#A23CF8";

type Palette = {
  bg: string;
  headerBg: string;
  headerBorder: string;
  headerText: string;
  headerSub: string;
  headerIcon: string;
  receivedBg: string;
  bubbleSentText: string;
  bubbleReceivedText: string;
  composerBg: string;
  composerBorder: string;
  composerInputBg: string;
  composerIcon: string;
  composerPlaceholder: string;
  dot: string;
};

function getPalette(theme: "light" | "dark"): Palette {
  if (theme === "dark") {
    return {
      bg: "#000000",
      headerBg: "#000000",
      headerBorder: "rgba(255,255,255,0.1)",
      headerText: "#ffffff",
      headerSub: "rgba(255,255,255,0.6)",
      headerIcon: "#ffffff",
      receivedBg: "#262626",
      bubbleSentText: "#ffffff",
      bubbleReceivedText: "#f5f5f5",
      composerBg: "#000000",
      composerBorder: "rgba(255,255,255,0.1)",
      composerInputBg: "#1c1c1c",
      composerIcon: "#ffffff",
      composerPlaceholder: "rgba(255,255,255,0.5)",
      dot: "rgba(255,255,255,0.55)",
    };
  }
  return {
    bg: "#ffffff",
    headerBg: "#ffffff",
    headerBorder: "rgba(0,0,0,0.08)",
    headerText: "#0f1014",
    headerSub: "rgba(15,16,20,0.55)",
    headerIcon: "#0f1014",
    receivedBg: "#efefef",
    bubbleSentText: "#ffffff",
    bubbleReceivedText: "#0f1014",
    composerBg: "#ffffff",
    composerBorder: "rgba(0,0,0,0.08)",
    composerInputBg: "#ffffff",
    composerIcon: "#0f1014",
    composerPlaceholder: "rgba(15,16,20,0.45)",
    dot: "rgba(15,16,20,0.5)",
  };
}

export const InstagramMessages: React.FC<InstagramMessagesProps> = ({
  contactName,
  contactAvatar = "https://avatars.githubusercontent.com/aryanranderiya?s=200",
  messages,
  theme,
  orientation = "landscape",
}) => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();
  const palette = getPalette(theme);
  const safe = useSafeArea();
  // Auto-portrait inside a device frame (see ChatFill for the same logic).
  const inDeviceFrame = safe.top > 0 || safe.bottom > 0;
  const effectiveOrientation =
    inDeviceFrame && orientation === "landscape" ? "portrait" : orientation;

  const chat = (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: palette.bg,
        color: palette.bubbleReceivedText,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header
        name={contactName}
        avatar={contactAvatar}
        frame={frame}
        fps={fps}
        palette={palette}
      />
      <Conversation
        frame={frame}
        fps={fps}
        messages={messages}
        palette={palette}
      />
      <Composer palette={palette} />
    </div>
  );

  const audio = messages.map((msg, i) => (
    <Sequence key={i} from={msg.delay + msg.typingFrames}>
      <Audio
        src={staticFile("sounds/message_bubble/message.mp3")}
        volume={0.85}
      />
    </Sequence>
  ));

  if (effectiveOrientation === "portrait") {
    // Parent-relative sizing — don't call useVideoConfig for layout here,
    // it returns the parent wrapper's canvas dims when nested in PhoneFrame.
    return (
      <AbsoluteFill
        style={{
          background: palette.bg,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "50%",
            aspectRatio: PORTRAIT_ASPECT,
            transform: "translateX(-50%)",
            background: palette.bg,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {safe.top > 0 && <div style={{ flexShrink: 0, height: safe.top }} />}
          <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
            {chat}
          </div>
          {safe.bottom > 0 && (
            <div style={{ flexShrink: 0, height: safe.bottom }} />
          )}
        </div>
        {audio}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: palette.bg, overflow: "hidden" }}>
      {chat}
      {audio}
    </AbsoluteFill>
  );
};

function Header({
  name,
  avatar,
  frame,
  fps,
  palette,
}: {
  name: string;
  avatar: string;
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
        height: HEADER_HEIGHT,
        background: palette.headerBg,
        borderBottom: `1px solid ${palette.headerBorder}`,
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: enter,
        transform: `translate3d(0, ${snap((1 - enter) * -8)}px, 0)`,
        flexShrink: 0,
      }}
    >
      <BackArrow color={palette.headerIcon} />
      <div
        style={{
          width: 70,
          height: 70,
          borderRadius: "50%",
          padding: 3,
          background:
            "conic-gradient(from 30deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5, #feda75)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: palette.headerBg,
            padding: 2,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <Img
            src={proxyExternalImg(avatar)}
            crossOrigin="anonymous"
            alt={name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "50%",
            }}
          />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: palette.headerText,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.005em",
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
        <div
          style={{
            color: palette.headerSub,
            fontSize: 18,
            marginTop: 2,
            fontWeight: 400,
          }}
        >
          Active now
        </div>
      </div>

      <HeaderIconButton color={palette.headerIcon}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </HeaderIconButton>
      <HeaderIconButton color={palette.headerIcon}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="m23 7-7 5 7 5V7zM14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </HeaderIconButton>
    </div>
  );
}

function BackArrow({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        flexShrink: 0,
      }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path
          d="M19 12H5M12 19l-7-7 7-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function HeaderIconButton({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

function Composer({ palette }: { palette: Palette }) {
  return (
    <div
      style={{
        height: COMPOSER_HEIGHT,
        background: palette.composerBg,
        borderTop: `1px solid ${palette.composerBorder}`,
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, #515bd4 0%, #dd2a7b 50%, #f58529 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 5v14M5 12h14"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div
        style={{
          flex: 1,
          height: 52,
          borderRadius: 26,
          background: palette.composerInputBg,
          border: `1px solid ${palette.composerBorder}`,
          display: "flex",
          alignItems: "center",
          padding: "0 18px",
          gap: 12,
        }}
      >
        <span
          style={{
            color: palette.composerPlaceholder,
            fontSize: 17,
            flex: 1,
          }}
        >
          Message...
        </span>
        <ComposerIcon color={palette.composerIcon} inline>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="3"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="9" cy="9" r="1.6" fill="currentColor" />
            <path
              d="m21 15-4-4-9 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </ComposerIcon>
        <ComposerIcon color={palette.composerIcon} inline>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </ComposerIcon>
      </div>
      <ComposerIcon color={palette.composerIcon}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </ComposerIcon>
    </div>
  );
}

function ComposerIcon({
  color,
  inline,
  children,
}: {
  color: string;
  inline?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: inline ? "auto" : 40,
        height: inline ? "auto" : 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

function Conversation({
  frame,
  fps,
  messages,
  palette,
}: {
  frame: number;
  fps: number;
  messages: ChatMessage[];
  palette: Palette;
}) {
  const heights = messages.map((msg) => {
    const local = frame - msg.delay;
    if (local < 0) return 0;
    const isTyping = local < msg.typingFrames;
    return isTyping ? TYPING_BUBBLE_HEIGHT : estimateBubbleHeight(msg.text);
  });

  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {messages.map((msg, i) => (
        <MessageRow
          key={i}
          msg={msg}
          index={i}
          messages={messages}
          heights={heights}
          frame={frame}
          fps={fps}
          palette={palette}
        />
      ))}
    </div>
  );
}

function MessageRow({
  msg,
  index,
  messages,
  heights,
  frame,
  fps,
  palette,
}: {
  msg: ChatMessage;
  index: number;
  messages: ChatMessage[];
  heights: number[];
  frame: number;
  fps: number;
  palette: Palette;
}) {
  const local = frame - msg.delay;
  if (local < 0) return null;

  const isTyping = local < msg.typingFrames;

  let stackOffset = 0;
  for (let j = index + 1; j < messages.length; j++) {
    const newerLocal = frame - messages[j]!.delay;
    if (newerLocal < 0) continue;
    const progress = spring({
      frame: newerLocal,
      fps,
      config: { damping: 24, stiffness: 130, mass: 0.7 },
    });
    stackOffset += progress * (heights[j]! + ROW_GAP);
  }

  const bottom = BOTTOM_PADDING + stackOffset;

  return (
    <div
      style={{
        position: "absolute",
        bottom,
        left: SIDE_PADDING,
        right: SIDE_PADDING,
        display: "flex",
        justifyContent: msg.side === "right" ? "flex-end" : "flex-start",
      }}
    >
      {isTyping ? (
        <TypingBubble
          side={msg.side}
          localFrame={local}
          fps={fps}
          palette={palette}
        />
      ) : (
        <MessageBubble
          side={msg.side}
          text={msg.text}
          localFrame={local - msg.typingFrames}
          fps={fps}
          palette={palette}
        />
      )}
    </div>
  );
}

const TYPING_BUBBLE_HEIGHT = 78;

function estimateBubbleHeight(text: string): number {
  const charsPerLine = 28;
  const explicitNewlines = text.match(/\n/g)?.length ?? 0;
  const lines = Math.max(
    1,
    Math.ceil(text.length / charsPerLine) + explicitNewlines,
  );
  return 76 + (lines - 1) * 42;
}

function TypingBubble({
  side,
  localFrame,
  fps,
  palette,
}: {
  side: ChatMessage["side"];
  localFrame: number;
  fps: number;
  palette: Palette;
}) {
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 170, mass: 0.6 },
  });
  const isRight = side === "right";

  return (
    <div
      style={{
        background: isRight ? SENT_BG : palette.receivedBg,
        padding: "22px 28px",
        borderRadius: 36,
        display: "flex",
        gap: 10,
        alignItems: "center",
        opacity: enter,
        transform: `scale(${0.85 + enter * 0.15})`,
        transformOrigin: isRight ? "bottom right" : "bottom left",
      }}
    >
      {[0, 1, 2].map((i) => {
        const phase = (localFrame + i * 5) / 7;
        const yBob = Math.sin(phase) * 4;
        const dotOpacity = 0.45 + Math.sin(phase) * 0.3;
        return (
          <span
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: isRight ? "rgba(255,255,255,0.85)" : palette.dot,
              transform: `translate3d(0, ${snap(-Math.abs(yBob))}px, 0)`,
              opacity: dotOpacity,
            }}
          />
        );
      })}
    </div>
  );
}

function MessageBubble({
  side,
  text,
  localFrame,
  fps,
  palette,
}: {
  side: ChatMessage["side"];
  text: string;
  localFrame: number;
  fps: number;
  palette: Palette;
}) {
  const pop = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 180, mass: 0.55 },
  });
  const isRight = side === "right";

  return (
    <div
      style={{
        background: isRight ? SENT_BG : palette.receivedBg,
        color: isRight ? palette.bubbleSentText : palette.bubbleReceivedText,
        padding: "18px 26px",
        borderRadius: 36,
        maxWidth: 880,
        minWidth: 80,
        fontSize: 30,
        fontWeight: 500,
        lineHeight: 1.32,
        letterSpacing: "-0.005em",
        opacity: pop,
        transform: `scale(${0.85 + pop * 0.15})`,
        transformOrigin: isRight ? "bottom right" : "bottom left",
        wordWrap: "break-word",
        whiteSpace: "pre-wrap",
      }}
    >
      {text}
    </div>
  );
}
