"use client";
import {
  Analytics01Icon,
  BubbleChatIcon,
  FavouriteIcon,
  MoreHorizontalCircle01Icon,
  RepeatIcon,
  Share08Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Img,
  spring,
  staticFile,
  useVideoConfig,
} from "remotion";
import { proxyExternalImg } from "../../proxy-image";
import { snap } from "../../snap";
import { useDesignFrame } from "../../use-design-frame";

export type TweetCardProps = {
  displayName: string;
  handle: string;
  avatarUrl: string;
  verified: "yes" | "no";
  text: string;
  timestamp: string;
  replies: number;
  retweets: number;
  likes: number;
  views: number;
  theme: "light" | "dark";
  backgroundColor: string;
};

const CARD_ENTER_END = 18;
const TYPE_START = 14;
const FRAMES_PER_CHAR = 2;

export const TweetCard: React.FC<TweetCardProps> = ({
  displayName,
  handle,
  avatarUrl,
  verified,
  text,
  timestamp,
  replies,
  retweets,
  likes,
  views,
  theme,
  backgroundColor,
}) => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 110, mass: 0.7 },
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
  const isTyping = frame >= TYPE_START && frame < typingEnd;
  const caretBlink =
    isTyping && Math.floor((frame - TYPE_START) / 12) % 2 === 0;

  const showAfterCard = frame >= CARD_ENTER_END;

  const isDark = theme === "dark";
  const cardBg = isDark ? "#000000" : "#ffffff";
  const cardText = isDark ? "#e7e9ea" : "#0f1419";
  const muted = isDark ? "#71767b" : "#536471";
  const divider = isDark ? "#2f3336" : "#eff3f4";
  const cardBorder = isDark ? "#2f3336" : "#eff3f4";

  return (
    <AbsoluteFill
      style={{
        background: backgroundColor,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
      }}
    >
      <Audio
        src={staticFile("sounds/message_bubble/message.mp3")}
        volume={0.85}
      />
      <div
        style={{
          width: 1560,
          background: cardBg,
          color: cardText,
          borderRadius: 36,
          border: `1px solid ${cardBorder}`,
          boxShadow: isDark
            ? "0 40px 100px rgba(0,0,0,0.5)"
            : "0 36px 100px rgba(15,16,20,0.10), 0 6px 16px rgba(15,16,20,0.05)",
          padding: 60,
          opacity: enter,
          transform: `translate3d(0, ${snap((1 - enter) * 32)}px, 0) scale(${0.96 + enter * 0.04})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <Avatar url={avatarUrl} initial={displayName.slice(0, 1)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 42,
                fontWeight: 700,
                letterSpacing: "-0.012em",
                lineHeight: 1.1,
              }}
            >
              <span>{displayName}</span>
              {verified === "yes" && <VerifiedBadge size={40} />}
            </div>
            <div style={{ fontSize: 30, color: muted, marginTop: 4 }}>
              {handle}
            </div>
          </div>
          <HugeiconsIcon
            icon={MoreHorizontalCircle01Icon}
            size={36}
            color={muted}
          />
        </div>

        <p
          style={{
            fontSize: 52,
            fontWeight: 400,
            lineHeight: 1.32,
            letterSpacing: "-0.012em",
            margin: "36px 0 0",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            minHeight: 70,
          }}
        >
          {visibleText}
          {isTyping && (
            <span
              style={{
                display: "inline-block",
                width: 4,
                height: 56,
                marginLeft: 6,
                background: cardText,
                opacity: caretBlink ? 1 : 0,
                verticalAlign: "text-bottom",
                borderRadius: 1,
              }}
            />
          )}
        </p>

        {timestamp.trim() && (
          <div
            style={{
              fontSize: 28,
              color: muted,
              marginTop: 36,
              opacity: showAfterCard ? 1 : 0,
            }}
          >
            {timestamp}
          </div>
        )}

        <div
          style={{
            height: 1,
            background: divider,
            margin: "32px 0",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: muted,
          }}
        >
          <Stat icon={BubbleChatIcon} value={replies} color={muted} />
          <Stat icon={RepeatIcon} value={retweets} color={muted} />
          <Stat icon={FavouriteIcon} value={likes} color={muted} />
          <Stat icon={Analytics01Icon} value={views} color={muted} />
          <Stat icon={Share08Icon} value={null} color={muted} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

function VerifiedBadge({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 22 22"
      width={size}
      height={size}
      style={{ flexShrink: 0 }}
    >
      <path
        fill="#1d9bf0"
        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
      />
    </svg>
  );
}

function Avatar({ url, initial }: { url: string; initial: string }) {
  if (url.trim()) {
    return (
      <Img
        src={proxyExternalImg(url)}
        crossOrigin="anonymous"
        width={108}
        height={108}
        style={{
          width: 108,
          height: 108,
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
        width: 108,
        height: 108,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #1d9bf0 0%, #4f46e5 100%)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 44,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initial.toUpperCase() || "?"}
    </div>
  );
}

function Stat({
  icon,
  value,
  color,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  value: number | null;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontSize: 28,
        fontWeight: 500,
        color,
      }}
    >
      <HugeiconsIcon icon={icon} size={36} color={color} />
      {value !== null && <span>{formatCount(value)}</span>}
    </div>
  );
}

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  if (n < 1_000_000) return Math.round(n / 1000) + "K";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
}
