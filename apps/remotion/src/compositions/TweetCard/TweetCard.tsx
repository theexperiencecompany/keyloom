"use client";
import {
  AiImageIcon,
  ArrowDown01Icon,
  Calendar03Icon,
  CheckListIcon,
  EarthIcon,
  Flag02Icon,
  Gif02Icon,
  Image02Icon,
  Location01Icon,
  SmileIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AbsoluteFill, Img } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { proxyExternalImg } from "../../proxy-image";
import { useCanvasLayout } from "../../use-canvas-layout";
import { useDesignFrame } from "../../use-design-frame";

export type TweetCardProps = {
  displayName: string;
  avatarUrl: string;
  text: string;
  audience: string;
  theme: "light" | "dark";
  clipStyle?: ClipStyle;
};

const CARD_ENTER_END = 18;
const TYPE_START = 22;
const FRAMES_PER_CHAR = 2;
const PRESS_GAP = 16;
const PRESS_DURATION = 12;

export const TweetCard: React.FC<TweetCardProps> = ({
  displayName,
  avatarUrl,
  text,
  audience,
  theme,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { width, height } = useCanvasLayout();

  // The compose card has a fixed internal layout (1480×~760); scale it to the
  // canvas so it fills the width and never overflows / gets cut off on any
  // aspect ratio.
  const CARD_W = 1480;
  const CARD_H = 760;
  const cardScale = Math.min(
    (width - 96) / CARD_W,
    (height - 96) / CARD_H,
    1.4,
  );

  const s = resolveClipStyle(clipStyle, {
    background: theme === "dark" ? "#000000" : "#ffffff",
    color: theme === "dark" ? "#e7e9ea" : "#0f1419",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#1d9bf0",
  });

  const typingDuration = text.length * FRAMES_PER_CHAR;
  const typingEnd = TYPE_START + typingDuration;
  const charsTyped =
    frame < TYPE_START
      ? 0
      : Math.min(
          text.length,
          Math.floor((frame - TYPE_START) / FRAMES_PER_CHAR),
        );
  const visibleText = text.slice(0, charsTyped);
  const hasText = charsTyped > 0;
  const isTyping = frame >= TYPE_START && frame < typingEnd;
  // Caret blinks before typing starts and while idle; solid while typing.
  const caretBlink = isTyping ? true : Math.floor(frame / 16) % 2 === 0;
  const showCaret = frame >= CARD_ENTER_END && frame < typingEnd + 8;

  // "Hit Post" click — a brief scale dip after typing completes.
  const pressStart = typingEnd + PRESS_GAP;
  const pressT =
    frame < pressStart ? 0 : Math.min(1, (frame - pressStart) / PRESS_DURATION);
  const postScale = 1 - Math.sin(pressT * Math.PI) * 0.12;
  const posted = frame >= pressStart + PRESS_DURATION;

  const isDark = theme === "dark";
  const cardBg = isDark ? "#000000" : "#ffffff";
  const cardText = isDark ? "#e7e9ea" : s.color;
  const placeholder = isDark ? "#71767b" : "#536471";
  const divider = isDark ? "#2f3336" : "#eff3f4";
  const pillBorder = isDark ? "#36393b" : "#cfd9de";
  const accent = s.accent;

  // Post button: dimmed pill until there is text, then solid + bold.
  const postBg = hasText
    ? isDark
      ? "#eff3f4"
      : accent
    : isDark
      ? "#22282b"
      : "#9bd1f9";
  const postColor = hasText
    ? isDark
      ? "#0f1419"
      : "#ffffff"
    : isDark
      ? "#6b7174"
      : "#ffffff";

  const toolbarIcons = [
    Image02Icon,
    Gif02Icon,
    AiImageIcon,
    CheckListIcon,
    SmileIcon,
    Calendar03Icon,
    Location01Icon,
    Flag02Icon,
  ];

  return (
    <AbsoluteFill
      style={{
        background: s.background,
        fontFamily: s.fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          width: CARD_W,
          background: cardBg,
          color: cardText,
          borderRadius: 32,
          border: `1px solid ${divider}`,
          boxShadow: isDark
            ? "0 40px 100px rgba(0,0,0,0.5)"
            : "0 36px 100px rgba(15,16,20,0.10), 0 6px 16px rgba(15,16,20,0.05)",
          padding: 56,
          transform: `scale(${cardScale})`,
          transformOrigin: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 28 }}>
          <Avatar url={avatarUrl} initial={displayName.slice(0, 1)} />

          <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
            {/* Audience pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: accent,
                fontSize: 28,
                fontWeight: 700,
                border: `1px solid ${pillBorder}`,
                borderRadius: 999,
                padding: "8px 18px",
              }}
            >
              <span>{audience}</span>
              <HugeiconsIcon icon={ArrowDown01Icon} size={26} color={accent} />
            </div>

            {/* Compose area */}
            <div
              style={{
                fontSize: 60,
                fontWeight: 400,
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
                margin: "30px 0 0",
                minHeight: 80,
                color: hasText ? cardText : placeholder,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {hasText ? visibleText : "What’s happening?"}
              {showCaret && (
                <span
                  style={{
                    display: "inline-block",
                    width: 4,
                    height: 62,
                    marginLeft: hasText ? 6 : 2,
                    background: accent,
                    opacity: caretBlink ? 1 : 0,
                    verticalAlign: "text-bottom",
                    borderRadius: 2,
                  }}
                />
              )}
            </div>

            {/* Everyone can reply */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 30,
                color: accent,
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              <HugeiconsIcon icon={EarthIcon} size={32} color={accent} />
              <span>Everyone can reply</span>
            </div>
          </div>
        </div>

        <div
          style={{ height: 1, background: divider, margin: "40px 0 28px" }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
            {toolbarIcons.map((icon, i) => (
              <HugeiconsIcon
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                icon={icon}
                size={40}
                color={accent}
              />
            ))}
          </div>

          <div
            style={{
              background: postBg,
              color: postColor,
              fontSize: 34,
              fontWeight: 700,
              borderRadius: 999,
              padding: "18px 46px",
              transform: `scale(${postScale})`,
              transformOrigin: "center",
              boxShadow:
                posted && isDark ? "0 0 0 6px rgba(239,243,244,0.12)" : "none",
            }}
          >
            Post
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

function Avatar({ url, initial }: { url: string; initial: string }) {
  if (url.trim()) {
    return (
      <Img
        src={proxyExternalImg(url)}
        crossOrigin="anonymous"
        width={92}
        height={92}
        style={{
          width: 92,
          height: 92,
          borderRadius: "50%",
          flexShrink: 0,
          objectFit: "cover",
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: 92,
        height: 92,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #1d9bf0 0%, #4f46e5 100%)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 40,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initial.toUpperCase() || "?"}
    </div>
  );
}
