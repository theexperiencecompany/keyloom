"use client";
import { AbsoluteFill, Img } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { proxyExternalImg } from "../../proxy-image";
import { useCanvasLayout } from "../../use-canvas-layout";

export type TweetPostProps = {
  displayName: string;
  /** Optional small image/logo shown inline next to the display name. */
  nameImageUrl: string;
  handle: string;
  avatarUrl: string;
  avatarShape: "rounded" | "circle";
  verified: "none" | "blue" | "gold";
  text: string;
  timestamp: string;
  theme: "light" | "dark";
  clipStyle?: ClipStyle;
};

// Fixed design size — the tweet is laid out at this size, then uniformly
// scaled to whatever canvas it renders on. No entrance animation: a published
// post is shown as-is.
const CARD_W = 1480;
const CARD_H = 360;

export const TweetPost: React.FC<TweetPostProps> = ({
  displayName,
  nameImageUrl,
  handle,
  avatarUrl,
  avatarShape,
  verified,
  text,
  timestamp,
  theme,
  clipStyle,
}) => {
  const { width, height } = useCanvasLayout();
  const isDark = theme === "dark";

  const s = resolveClipStyle(clipStyle, {
    background: isDark ? "#000000" : "#ffffff",
    color: isDark ? "#e7e9ea" : "#0f1419",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, 'Apple Color Emoji', sans-serif",
    accent: "#1d9bf0",
  });

  const nameColor = isDark ? "#e7e9ea" : s.color;
  const mutedColor = isDark ? "#71767b" : "#536471";

  const cardScale = Math.min(
    (width - 120) / CARD_W,
    (height - 100) / CARD_H,
    1.6,
  );

  const avatarRadius = avatarShape === "circle" ? "50%" : "24%";

  return (
    <AbsoluteFill
      style={{
        background: s.background,
        fontFamily: s.fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
      }}
    >
      <div
        style={{
          width: CARD_W,
          transform: `scale(${cardScale})`,
          transformOrigin: "center",
          flexShrink: 0,
        }}
      >
        {/* Header: avatar + name / handle */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <Avatar
            url={avatarUrl}
            initial={displayName.slice(0, 1)}
            radius={avatarRadius}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontSize: 52,
                  fontWeight: 800,
                  color: nameColor,
                  letterSpacing: "-0.01em",
                }}
              >
                {displayName}
              </span>
              {verified !== "none" && (
                <VerifiedSeal variant={verified} accent={s.accent} />
              )}
              {nameImageUrl.trim() && (
                <Img
                  src={proxyExternalImg(nameImageUrl)}
                  crossOrigin="anonymous"
                  width={46}
                  height={46}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 10,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
            <span style={{ fontSize: 44, fontWeight: 400, color: mutedColor }}>
              @{handle}
            </span>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            marginTop: 40,
            fontSize: 56,
            lineHeight: 1.3,
            fontWeight: 400,
            color: nameColor,
            letterSpacing: "-0.005em",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {text}
        </div>

        {/* Timestamp */}
        <div
          style={{
            marginTop: 34,
            fontSize: 40,
            fontWeight: 400,
            color: mutedColor,
          }}
        >
          {timestamp}
        </div>
      </div>
    </AbsoluteFill>
  );
};

function Avatar({
  url,
  initial,
  radius,
}: {
  url: string;
  initial: string;
  radius: string;
}) {
  const SIZE = 112;
  if (url.trim()) {
    return (
      <Img
        src={proxyExternalImg(url)}
        crossOrigin="anonymous"
        width={SIZE}
        height={SIZE}
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: radius,
          flexShrink: 0,
          objectFit: "cover",
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: SIZE,
        height: SIZE,
        borderRadius: radius,
        background:
          "conic-gradient(from 210deg, #ff5f6d, #ffc371, #47cf73, #4f9dff, #a06bff, #ff5f6d)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 50,
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {initial.toUpperCase() || "?"}
    </div>
  );
}

/**
 * X "verified" scalloped seal. The check is an even-odd cut-out, so the
 * background shows through it as a check mark on the colored seal.
 */
function VerifiedSeal({
  variant,
  accent,
}: {
  variant: "blue" | "gold";
  accent: string;
}) {
  const fill = variant === "gold" ? "#dfa01f" : accent;
  return (
    <svg
      width={46}
      height={46}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      <path
        fill={fill}
        fillRule="evenodd"
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"
      />
    </svg>
  );
}
