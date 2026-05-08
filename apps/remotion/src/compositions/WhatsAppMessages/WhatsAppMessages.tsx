"use client";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { ChatMessage } from "../../editors/types";

export type WhatsAppMessagesProps = {
  contactName: string;
  messages: ChatMessage[];
  theme: "light" | "dark";
};

const ROW_GAP = 14;
const BOTTOM_PADDING = 28;
const COMPOSER_HEIGHT = 80;
const HEADER_HEIGHT = 96;
const SIDE_PADDING = 36;

type Palette = {
  bg: string;
  wallpaper: string;
  wallpaperOpacity: number;
  headerBg: string;
  headerBorder: string;
  headerText: string;
  headerSub: string;
  headerIcon: string;
  receivedBg: string;
  sentBg: string;
  bubbleText: string;
  bubbleMeta: string;
  bubbleShadow: string;
  composerBg: string;
  composerInputBg: string;
  composerIcon: string;
  composerPlaceholder: string;
  dot: string;
  check: string;
  replyAccent: string;
  replyMuted: string;
};

function getPalette(theme: "light" | "dark"): Palette {
  if (theme === "dark") {
    return {
      bg: "#0B141A",
      wallpaper: WALLPAPER_SVG("rgba(255,255,255,0.06)"),
      wallpaperOpacity: 1,
      headerBg: "#202C33",
      headerBorder: "rgba(255,255,255,0.06)",
      headerText: "#E9EDEF",
      headerSub: "rgba(233,237,239,0.6)",
      headerIcon: "rgba(233,237,239,0.7)",
      receivedBg: "#202C33",
      sentBg: "#005C4B",
      bubbleText: "#E9EDEF",
      bubbleMeta: "rgba(233,237,239,0.5)",
      bubbleShadow: "0 1px 0.5px rgba(0,0,0,0.35)",
      composerBg: "#202C33",
      composerInputBg: "#2A3942",
      composerIcon: "rgba(233,237,239,0.55)",
      composerPlaceholder: "rgba(233,237,239,0.45)",
      dot: "rgba(233,237,239,0.55)",
      check: "#53BDEB",
      replyAccent: "#06CF9C",
      replyMuted: "rgba(233,237,239,0.55)",
    };
  }
  return {
    bg: "#EFE7DD",
    wallpaper: WALLPAPER_SVG("rgba(0,0,0,0.05)"),
    wallpaperOpacity: 1,
    headerBg: "#F0F2F5",
    headerBorder: "rgba(0,0,0,0.08)",
    headerText: "#111B21",
    headerSub: "rgba(17,27,33,0.55)",
    headerIcon: "rgba(17,27,33,0.55)",
    receivedBg: "#FFFFFF",
    sentBg: "#D9FDD3",
    bubbleText: "#111B21",
    bubbleMeta: "rgba(17,27,33,0.45)",
    bubbleShadow: "0 1px 0.5px rgba(11,20,26,0.13)",
    composerBg: "#F0F2F5",
    composerInputBg: "#FFFFFF",
    composerIcon: "rgba(17,27,33,0.55)",
    composerPlaceholder: "rgba(17,27,33,0.4)",
    dot: "rgba(17,27,33,0.45)",
    check: "#53BDEB",
    replyAccent: "#06CF9C",
    replyMuted: "rgba(17,27,33,0.55)",
  };
}

function WALLPAPER_SVG(fill: string) {
  // Subtle doodle-style pattern reminiscent of WhatsApp's chat wallpaper.
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><g fill='none' stroke='${fill}' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'>
<path d='M22 28 q6 -10 14 0 q6 10 14 0'/>
<circle cx='90' cy='34' r='8'/>
<path d='M86 34 h8 M90 30 v8'/>
<path d='M140 22 l10 14 l-20 0 z'/>
<path d='M170 30 q10 4 0 12 q-10 -4 0 -12'/>
<path d='M30 80 c0 -10 16 -10 16 0 c0 8 -16 14 -16 22'/>
<rect x='70' y='72' width='22' height='14' rx='3'/>
<path d='M120 72 q10 0 10 10 t-10 10 t-10 -10 t10 -10'/>
<path d='M158 76 l10 10 M168 76 l-10 10'/>
<path d='M20 130 q10 -10 20 0 q10 10 20 0'/>
<circle cx='95' cy='128' r='9'/>
<path d='M89 128 q6 6 12 0'/>
<path d='M140 122 l4 12 l8 -2 l-4 -12 z'/>
<path d='M174 130 q-6 -8 -12 0 q-6 8 -12 0'/>
<path d='M28 174 c0 -8 12 -8 12 0 v6 h-12 z'/>
<path d='M70 178 q10 -10 22 0'/>
<circle cx='130' cy='176' r='6'/>
<path d='M160 170 l8 12 l-16 0 z'/>
</g></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

export const WhatsAppMessages: React.FC<WhatsAppMessagesProps> = ({
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
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        color: palette.bubbleText,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: palette.wallpaper,
          backgroundSize: "200px 200px",
          opacity: palette.wallpaperOpacity,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
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
          palette={palette}
        />
        <Composer palette={palette} />
      </div>
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
        height: HEADER_HEIGHT,
        background: palette.headerBg,
        borderBottom: `1px solid ${palette.headerBorder}`,
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        opacity: enter,
        transform: `translateY(${(1 - enter) * -8}px)`,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          overflow: "hidden",
          background:
            "conic-gradient(from 210deg, #6e7c84 0deg, #2a3942 120deg, #6e7c84 240deg, #2a3942 360deg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.85)",
          fontSize: 24,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {name.slice(0, 1).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: palette.headerText,
            fontSize: 22,
            fontWeight: 500,
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
            fontSize: 14,
            marginTop: 2,
            fontWeight: 400,
          }}
        >
          online
        </div>
      </div>

      <HeaderIconButton color={palette.headerIcon}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle
            cx="11"
            cy="11"
            r="7"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M16.5 16.5 L21 21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </HeaderIconButton>
      <HeaderIconButton color={palette.headerIcon}>
        <svg width="6" height="22" viewBox="0 0 6 24" fill="currentColor">
          <circle cx="3" cy="5" r="2" />
          <circle cx="3" cy="12" r="2" />
          <circle cx="3" cy="19" r="2" />
        </svg>
      </HeaderIconButton>
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
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexShrink: 0,
      }}
    >
      <ComposerIcon color={palette.composerIcon}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </ComposerIcon>
      <div
        style={{
          flex: 1,
          height: 48,
          borderRadius: 24,
          background: palette.composerInputBg,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
        }}
      >
        <ComposerIcon color={palette.composerIcon} inline>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="9" cy="10" r="1.2" fill="currentColor" />
            <circle cx="15" cy="10" r="1.2" fill="currentColor" />
            <path
              d="M9 14.5c1.2 1.4 4.8 1.4 6 0"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </ComposerIcon>
        <span
          style={{
            color: palette.composerPlaceholder,
            fontSize: 17,
            flex: 1,
          }}
        >
          Type a message
        </span>
      </div>
      <ComposerIcon color={palette.composerIcon}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect
            x="9"
            y="3"
            width="6"
            height="12"
            rx="3"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M5 11a7 7 0 0 0 14 0M12 18v3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
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
  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        padding: `0 ${SIDE_PADDING}px`,
      }}
    >
      {messages.map((msg, i) => (
        <MessageRow
          key={i}
          msg={msg}
          index={i}
          messages={messages}
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
  frame,
  fps,
  palette,
}: {
  msg: ChatMessage;
  index: number;
  messages: ChatMessage[];
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
      config: { damping: 22, stiffness: 130, mass: 0.7 },
    });
    stackOffset += progress;
  }

  const rowHeight = isTyping ? 64 : estimateBubbleHeight(msg.text);
  const bottom = BOTTOM_PADDING + stackOffset * (rowHeight + ROW_GAP);

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

function estimateBubbleHeight(text: string): number {
  const charsPerLine = 38;
  const lines = Math.max(
    1,
    Math.ceil(text.length / charsPerLine) +
      (text.match(/\n/g)?.length ?? 0),
  );
  return 36 + lines * 32;
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
        position: "relative",
        background: isRight ? palette.sentBg : palette.receivedBg,
        padding: "14px 18px",
        borderRadius: 8,
        borderTopRightRadius: isRight ? 0 : 8,
        borderTopLeftRadius: isRight ? 8 : 0,
        display: "flex",
        gap: 8,
        alignItems: "center",
        opacity: enter,
        transform: `scale(${0.85 + enter * 0.15})`,
        transformOrigin: isRight ? "bottom right" : "bottom left",
        boxShadow: palette.bubbleShadow,
      }}
    >
      <BubbleTail side={side} palette={palette} />
      {[0, 1, 2].map((i) => {
        const phase = (localFrame + i * 5) / 7;
        const yBob = Math.sin(phase) * 4;
        const dotOpacity = 0.45 + Math.sin(phase) * 0.3;
        return (
          <span
            key={i}
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: palette.dot,
              transform: `translateY(${-Math.abs(yBob)}px)`,
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
        position: "relative",
        background: isRight ? palette.sentBg : palette.receivedBg,
        color: palette.bubbleText,
        padding: "8px 12px 10px",
        borderRadius: 8,
        borderTopRightRadius: isRight ? 0 : 8,
        borderTopLeftRadius: isRight ? 8 : 0,
        maxWidth: 760,
        minWidth: 80,
        fontSize: 22,
        fontWeight: 400,
        lineHeight: 1.35,
        letterSpacing: "-0.005em",
        opacity: pop,
        transform: `scale(${0.85 + pop * 0.15})`,
        transformOrigin: isRight ? "bottom right" : "bottom left",
        wordWrap: "break-word",
        boxShadow: palette.bubbleShadow,
      }}
    >
      <BubbleTail side={side} palette={palette} />
      <div
        style={{
          paddingRight: isRight ? 88 : 64,
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </div>
      <div
        style={{
          position: "absolute",
          right: 12,
          bottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
          color: palette.bubbleMeta,
        }}
      >
        <span>now</span>
        {isRight ? <DoubleCheck color={palette.check} /> : null}
      </div>
    </div>
  );
}

function BubbleTail({
  side,
  palette,
}: {
  side: ChatMessage["side"];
  palette: Palette;
}) {
  const isRight = side === "right";
  const fill = isRight ? palette.sentBg : palette.receivedBg;
  return (
    <svg
      width="12"
      height="14"
      viewBox="0 0 12 14"
      style={{
        position: "absolute",
        top: 0,
        [isRight ? "right" : "left"]: -8,
        transform: isRight ? "scaleX(-1)" : "none",
        filter: `drop-shadow(${palette.bubbleShadow})`,
        display: "block",
      }}
    >
      <path d="M12 0 H4 Q4 8 0 8 Q8 8 12 4 Z" fill={fill} />
    </svg>
  );
}

function DoubleCheck({ color }: { color: string }) {
  return (
    <svg width="18" height="11" viewBox="0 0 18 11" fill="none">
      <path
        d="M1 6 L4 9 L10 2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 9 L9 6 M9 9 L17 1"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
