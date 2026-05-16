"use client";
import {
  Bookmark01Icon,
  Chat01Icon,
  FavouriteIcon,
  MoreHorizontalIcon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AbsoluteFill, Img, spring, useVideoConfig } from "remotion";
import { proxyExternalImg } from "../../proxy-image";
import { snap } from "../../snap";
import { useDesignFrame } from "../../use-design-frame";

export type InstagramPostProps = {
  username: string;
  location: string;
  avatarUrl: string;
  verified: "yes" | "no";
  imageUrl: string;
  caption: string;
  likes: number;
  timestamp: string;
  theme: "light" | "dark";
  backgroundColor: string;
};

const CARD_ENTER_END = 18;

export const InstagramPost: React.FC<InstagramPostProps> = ({
  username,
  location,
  avatarUrl,
  verified,
  imageUrl,
  caption,
  likes,
  timestamp,
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

  const heartPop = spring({
    frame: frame - 28,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.5 },
  });

  const showAfterCard = frame >= CARD_ENTER_END;

  const isDark = theme === "dark";
  const cardBg = isDark ? "#000000" : "#ffffff";
  const cardText = isDark ? "#f5f5f5" : "#0f1014";
  const muted = isDark ? "#a8a8a8" : "#737373";
  const cardBorder = isDark ? "#262626" : "#dbdbdb";

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
      <div
        style={{
          width: 1080,
          background: cardBg,
          color: cardText,
          borderRadius: 28,
          border: `1px solid ${cardBorder}`,
          boxShadow: isDark
            ? "0 40px 100px rgba(0,0,0,0.5)"
            : "0 36px 100px rgba(15,16,20,0.10), 0 6px 16px rgba(15,16,20,0.05)",
          opacity: enter,
          transform: `translate3d(0, ${snap((1 - enter) * 32)}px, 0) scale(${0.96 + enter * 0.04})`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "20px 24px",
          }}
        >
          <Avatar url={avatarUrl} initial={username.slice(0, 1)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: "-0.005em",
                lineHeight: 1.15,
              }}
            >
              <span>{username}</span>
              {verified === "yes" && <VerifiedBadge size={26} />}
            </div>
            {location.trim() && (
              <div
                style={{
                  fontSize: 20,
                  color: cardText,
                  marginTop: 2,
                  fontWeight: 400,
                }}
              >
                {location}
              </div>
            )}
          </div>
          <HugeiconsIcon icon={MoreHorizontalIcon} size={32} color={cardText} />
        </div>

        <div
          style={{
            width: "100%",
            aspectRatio: "1 / 1",
            background: isDark ? "#111" : "#fafafa",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {imageUrl.trim() ? (
            <Img
              src={proxyExternalImg(imageUrl)}
              crossOrigin="anonymous"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <AbsoluteFill
              style={{
                background:
                  "linear-gradient(135deg, #f58529 0%, #dd2a7b 50%, #515bd4 100%)",
              }}
            />
          )}

          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              opacity: heartPop > 0 ? heartPop * (1 - heartPop) * 4 : 0,
            }}
          >
            <HugeiconsIcon
              icon={FavouriteIcon}
              size={260}
              color="#ffffff"
              strokeWidth={2}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "18px 24px 8px",
            gap: 22,
          }}
        >
          <HugeiconsIcon
            icon={FavouriteIcon}
            size={40}
            color={cardText}
            strokeWidth={1.6}
          />
          <HugeiconsIcon
            icon={Chat01Icon}
            size={40}
            color={cardText}
            strokeWidth={1.6}
          />
          <HugeiconsIcon
            icon={SentIcon}
            size={40}
            color={cardText}
            strokeWidth={1.6}
          />
          <div style={{ flex: 1 }} />
          <HugeiconsIcon
            icon={Bookmark01Icon}
            size={40}
            color={cardText}
            strokeWidth={1.6}
          />
        </div>

        <div
          style={{
            padding: "0 24px 24px",
            opacity: showAfterCard ? 1 : 0,
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: "-0.005em",
            }}
          >
            {formatLikes(likes)} likes
          </div>
          {caption.trim() && (
            <p
              style={{
                fontSize: 24,
                fontWeight: 400,
                lineHeight: 1.4,
                margin: "10px 0 0",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              <span style={{ fontWeight: 600, marginRight: 8 }}>
                {username}
              </span>
              {caption}
            </p>
          )}
          {timestamp.trim() && (
            <div
              style={{
                fontSize: 18,
                color: muted,
                marginTop: 14,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              {timestamp}
            </div>
          )}
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
        fill="#0095f6"
        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
      />
    </svg>
  );
}

function Avatar({ url, initial }: { url: string; initial: string }) {
  const inner = url.trim() ? (
    <Img
      src={proxyExternalImg(url)}
      crossOrigin="anonymous"
      width={72}
      height={72}
      style={{
        width: 72,
        height: 72,
        borderRadius: "50%",
        objectFit: "cover",
      }}
    />
  ) : (
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #f58529 0%, #dd2a7b 100%)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 30,
        fontWeight: 700,
      }}
    >
      {initial.toUpperCase() || "?"}
    </div>
  );
  return (
    <div
      style={{
        width: 84,
        height: 84,
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
          background: "#fff",
          padding: 3,
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {inner}
      </div>
    </div>
  );
}

function formatLikes(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  if (n < 1_000_000) return Math.round(n / 1000) + "K";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
}
