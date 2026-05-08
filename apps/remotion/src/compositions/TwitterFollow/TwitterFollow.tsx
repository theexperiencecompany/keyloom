"use client";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type TwitterFollowProps = {
  handle: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  followers: number;
  following: number;
  verified: "yes" | "no";
  theme: "light" | "dark";
  backgroundColor: string;
};

const D_CARD = 0;
const D_NAME = 12;
const D_HANDLE = 18;
const D_BIO = 26;
const D_STATS = 34;
const D_BUTTON = 44;
const D_CURSOR_IN = 70;
const D_CLICK = 110;
const D_AFTER_CLICK = 118;

const clean = (h: string) => h.replace(/^@/, "");

export const TwitterFollow: React.FC<TwitterFollowProps> = ({
  handle,
  displayName,
  avatarUrl,
  bio,
  followers,
  following,
  verified,
  theme,
  backgroundColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isDark = theme === "dark";
  const palette = {
    cardBg: isDark ? "#15181c" : "#ffffff",
    text: isDark ? "#e7e9ea" : "#0f1419",
    muted: isDark ? "#71767b" : "#536471",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,20,25,0.08)",
    primary: "#1d9bf0",
    followingBg: isDark ? "transparent" : "transparent",
    followingBorder: isDark ? "#536471" : "#cfd9de",
  };

  const cardSpring = spring({
    frame: frame - D_CARD,
    fps,
    config: { damping: 14, stiffness: 130, mass: 0.85 },
  });
  const cardOpacity = cardSpring;
  const cardScale = 0.9 + cardSpring * 0.1;
  const cardY = (1 - cardSpring) * 24;

  const followed = frame >= D_CLICK;

  const buttonClickSpring = spring({
    frame: frame - D_CLICK,
    fps,
    config: { damping: 9, stiffness: 220, mass: 0.5 },
  });
  const clickPulse = frame < D_CLICK ? 0 : Math.max(0, 1 - buttonClickSpring);
  const buttonScale = followed ? 1 - clickPulse * 0.12 : 1;

  const followerBumpSpring = spring({
    frame: frame - D_AFTER_CLICK,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.55 },
  });
  const followerBump = followed ? 1 - Math.max(0, 1 - followerBumpSpring) * 0.18 : 1;
  const displayedFollowers = followed ? followers + 1 : followers;

  return (
    <AbsoluteFill
      style={{
        background: backgroundColor,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Inter, sans-serif",
        color: palette.text,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 920,
            background: palette.cardBg,
            border: `1px solid ${palette.border}`,
            borderRadius: 28,
            padding: "36px 40px 40px",
            boxShadow:
              "0 30px 80px rgba(15,16,20,0.10), 0 4px 10px rgba(15,16,20,0.05)",
            opacity: cardOpacity,
            transform: `translateY(${cardY}px) scale(${cardScale})`,
            willChange: "transform, opacity",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 24,
            }}
          >
            <Img
              src={avatarUrl}
              alt={displayName}
              width={140}
              height={140}
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                objectFit: "cover",
                border: `4px solid ${palette.cardBg}`,
                boxShadow: `0 0 0 1px ${palette.border}`,
                flexShrink: 0,
              }}
            />
            <FollowButton
              followed={followed}
              palette={palette}
              scale={buttonScale}
              entranceFrame={frame - D_BUTTON}
              fps={fps}
            />
          </div>

          <div style={{ marginTop: 22 }}>
            <PopIn frame={frame - D_NAME} fps={fps}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 36,
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.1,
                }}
              >
                <span>{displayName}</span>
                {verified === "yes" ? <VerifiedBadge size={28} /> : null}
              </div>
            </PopIn>
            <PopIn frame={frame - D_HANDLE} fps={fps}>
              <div
                style={{
                  fontSize: 24,
                  color: palette.muted,
                  marginTop: 6,
                }}
              >
                @{clean(handle)}
              </div>
            </PopIn>
          </div>

          <PopIn frame={frame - D_BIO} fps={fps}>
            <div
              style={{
                marginTop: 22,
                fontSize: 26,
                lineHeight: 1.4,
                color: palette.text,
                letterSpacing: "-0.005em",
              }}
            >
              {bio}
            </div>
          </PopIn>

          <PopIn frame={frame - D_STATS} fps={fps}>
            <div
              style={{
                marginTop: 22,
                display: "flex",
                gap: 26,
                fontSize: 22,
                color: palette.muted,
              }}
            >
              <span>
                <strong style={{ color: palette.text, fontWeight: 700 }}>
                  {following.toLocaleString()}
                </strong>{" "}
                Following
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "baseline",
                  gap: 6,
                  transform: `scale(${followerBump})`,
                  transformOrigin: "left center",
                  willChange: "transform",
                }}
              >
                <strong
                  style={{
                    color: palette.text,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {displayedFollowers.toLocaleString()}
                </strong>{" "}
                Followers
              </span>
            </div>
          </PopIn>

          <Cursor
            frame={frame}
            fps={fps}
            visibleFrom={D_CURSOR_IN}
            clickFrame={D_CLICK}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

function FollowButton({
  followed,
  palette,
  scale,
  entranceFrame,
  fps,
}: {
  followed: boolean;
  palette: {
    text: string;
    primary: string;
    followingBorder: string;
    cardBg: string;
  };
  scale: number;
  entranceFrame: number;
  fps: number;
}) {
  const enter = spring({
    frame: entranceFrame,
    fps,
    config: { damping: 15, stiffness: 160, mass: 0.6 },
  });
  return (
    <div
      style={{
        opacity: enter,
        transform: `translateY(${(1 - enter) * 12}px) scale(${scale})`,
        willChange: "transform, opacity",
        padding: "14px 32px",
        borderRadius: 999,
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: "-0.005em",
        cursor: "pointer",
        userSelect: "none",
        transition: "background 120ms",
        background: followed ? "transparent" : palette.text,
        color: followed ? palette.text : palette.cardBg,
        border: followed
          ? `1px solid ${palette.followingBorder}`
          : "1px solid transparent",
        minWidth: 160,
        textAlign: "center",
      }}
    >
      {followed ? "Following" : "Follow"}
    </div>
  );
}

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

function Cursor({
  frame,
  fps,
  visibleFrom,
  clickFrame,
}: {
  frame: number;
  fps: number;
  visibleFrom: number;
  clickFrame: number;
}) {
  if (frame < visibleFrom) return null;

  const moveProgress = spring({
    frame: frame - visibleFrom,
    fps,
    config: { damping: 22, stiffness: 80, mass: 1 },
    durationInFrames: clickFrame - visibleFrom,
  });

  const startX = 720;
  const startY = 520;
  const endX = 760;
  const endY = 60;

  const x = interpolate(moveProgress, [0, 1], [startX, endX]);
  const y = interpolate(moveProgress, [0, 1], [startY, endY]);

  const clickProgress = spring({
    frame: frame - clickFrame,
    fps,
    config: { damping: 9, stiffness: 220, mass: 0.5 },
  });
  const ringScale = frame < clickFrame ? 0 : interpolate(clickProgress, [0, 1], [0.5, 1.6]);
  const ringOpacity =
    frame < clickFrame ? 0 : interpolate(clickProgress, [0, 1], [0.55, 0]);
  const cursorPress =
    frame >= clickFrame && frame < clickFrame + 8 ? 0.85 : 1;

  const fadeOut = interpolate(
    frame,
    [clickFrame + 14, clickFrame + 26],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 0,
        height: 0,
        opacity: fadeOut,
        willChange: "transform, opacity",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -38,
          top: -38,
          width: 76,
          height: 76,
          borderRadius: "50%",
          border: "4px solid #1d9bf0",
          opacity: ringOpacity,
          transform: `scale(${ringScale})`,
          willChange: "transform, opacity",
        }}
      />
      <svg
        width={48}
        height={48}
        viewBox="0 0 24 24"
        style={{
          transform: `scale(${cursorPress})`,
          transformOrigin: "0 0",
          filter: "drop-shadow(0 6px 12px rgba(15,16,20,0.25))",
        }}
      >
        <path
          d="M3 2l7 18 2.5-7.5L20 10z"
          fill="#ffffff"
          stroke="#0f1419"
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function PopIn({
  frame,
  fps,
  children,
}: {
  frame: number;
  fps: number;
  children: React.ReactNode;
}) {
  const pop = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 150, mass: 0.7 },
  });
  return (
    <div
      style={{
        opacity: pop,
        transform: `translateY(${(1 - pop) * 14}px)`,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}
