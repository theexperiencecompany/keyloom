"use client";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type GitHubFollowerCountProps = {
  username: string;
  startCount: number;
  endCount: number;
  followers: string;
  theme: "light" | "dark";
};

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const COUNT_EASE = Easing.bezier(0.65, 0, 0.35, 1);

const THEME = {
  light: {
    pageBg: "#ffffff",
    cardBg: "#ffffff",
    border: "#d1d9e0",
    text: "#1f2328",
    muted: "#59636e",
    link: "#0969da",
    count: "#1f2328",
    countBg: "#f6f8fa",
    chipBg: "#f6f8fa",
    chipBorder: "#d1d9e0",
    cardShadow:
      "0 1px 0 rgba(31,35,40,0.04), 0 12px 36px rgba(140,149,159,0.22)",
  },
  dark: {
    pageBg: "#010409",
    cardBg: "#0d1117",
    border: "#3d444d",
    text: "#f0f6fc",
    muted: "#9198a1",
    link: "#4493f8",
    count: "#f0f6fc",
    countBg: "#15191f",
    chipBg: "#212830",
    chipBorder: "#3d444d",
    cardShadow: "0 12px 36px rgba(0,0,0,0.55)",
  },
} as const;

// Scale ratio matches GitHubStarButton — the real card is small in a 1920×1080
// frame, so multiply everything by SCALE for legibility.
const SCALE = 3;
const px = (n: number) => Math.round(n * SCALE);

const DIGIT_HEIGHT_PX = px(34);
const COUNT_START_FRAME = 30;
const COUNT_DURATION = 80;

export const GitHubFollowerCount: React.FC<GitHubFollowerCountProps> = ({
  username,
  startCount,
  endCount,
  followers,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = THEME[theme];

  const followerUsernames = followers
    .split(/[\s,]+/)
    .map((u) => u.trim().replace(/^@/, ""))
    .filter(Boolean);

  const cardEnter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.7 },
  });

  const animatedCount = interpolate(
    frame,
    [COUNT_START_FRAME, COUNT_START_FRAME + COUNT_DURATION],
    [startCount, endCount],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: COUNT_EASE,
    },
  );

  const newFollowers = Math.max(0, endCount - startCount);
  const visibleAvatars = Math.min(
    followerUsernames.length,
    Math.max(0, Math.round(animatedCount - startCount)),
  );

  return (
    <AbsoluteFill
      style={{
        background: t.pageBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
        color: t.text,
        padding: 80,
      }}
    >
      <div
        style={{
          width: px(280),
          background: t.cardBg,
          border: `${px(1)}px solid ${t.border}`,
          borderRadius: px(14),
          padding: `${px(24)}px ${px(22)}px`,
          boxShadow: t.cardShadow,
          opacity: cardEnter,
          transform: `translateY(${(1 - cardEnter) * 18}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Img
          src={`https://github.com/${username}.png?size=400`}
          alt={username}
          width={px(96)}
          height={px(96)}
          style={{
            width: px(96),
            height: px(96),
            borderRadius: "50%",
            border: `${px(1)}px solid ${t.border}`,
            objectFit: "cover",
          }}
        />

        <div
          style={{
            marginTop: px(14),
            fontSize: px(18),
            fontWeight: 700,
            color: t.text,
          }}
        >
          @{username}
        </div>

        <div
          style={{
            marginTop: px(16),
            display: "inline-flex",
            alignItems: "baseline",
            gap: px(8),
            padding: `${px(12)}px ${px(18)}px`,
            background: t.countBg,
            border: `${px(1)}px solid ${t.border}`,
            borderRadius: px(12),
          }}
        >
          <SlotNumber
            value={animatedCount}
            digitHeight={DIGIT_HEIGHT_PX}
            color={t.count}
            targetWidth={getDigitCount(endCount)}
          />
          <span
            style={{
              fontSize: px(12),
              fontWeight: 500,
              color: t.muted,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            followers
          </span>
        </div>

        {newFollowers > 0 && (
          <FollowerDelta
            delta={newFollowers}
            frame={frame}
            color={t.link}
            muted={t.muted}
          />
        )}

        {followerUsernames.length > 0 && (
          <FollowerCascade
            usernames={followerUsernames}
            visibleCount={visibleAvatars}
            frame={frame}
            t={t}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};

function FollowerDelta({
  delta,
  frame,
  color,
  muted,
}: {
  delta: number;
  frame: number;
  color: string;
  muted: string;
}) {
  const enter = interpolate(
    frame,
    [
      COUNT_START_FRAME + COUNT_DURATION - 6,
      COUNT_START_FRAME + COUNT_DURATION + 12,
    ],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: APPLE_EASE,
    },
  );
  return (
    <div
      style={{
        marginTop: px(8),
        fontSize: px(11),
        fontWeight: 600,
        color,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 6}px)`,
      }}
    >
      +{delta} <span style={{ color: muted, fontWeight: 400 }}>this week</span>
    </div>
  );
}

function FollowerCascade({
  usernames,
  visibleCount,
  frame,
  t,
}: {
  usernames: string[];
  visibleCount: number;
  frame: number;
  t: (typeof THEME)[keyof typeof THEME];
}) {
  const avatarSize = px(28);
  const overlap = px(10);
  const baseDelay = COUNT_START_FRAME + 6;
  const stagger = Math.max(
    2,
    Math.floor(COUNT_DURATION / Math.max(usernames.length, 1)),
  );

  return (
    <div
      style={{
        marginTop: px(14),
        paddingTop: px(14),
        borderTop: `${px(1)}px solid ${t.border}`,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: px(8),
      }}
    >
      <span
        style={{
          fontSize: px(10),
          fontWeight: 500,
          color: t.muted,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Recent followers
      </span>
      <div
        style={{
          display: "flex",
          height: avatarSize,
          paddingLeft: overlap,
        }}
      >
        {usernames.map((user, i) => {
          const visible = i < visibleCount;
          const enterFrame = baseDelay + i * stagger;
          const enter = visible
            ? interpolate(frame, [enterFrame, enterFrame + 14], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: APPLE_EASE,
              })
            : 0;
          return (
            <Img
              key={user}
              src={`https://github.com/${user}.png?size=80`}
              alt={user}
              width={avatarSize}
              height={avatarSize}
              style={{
                width: avatarSize,
                height: avatarSize,
                borderRadius: "50%",
                marginLeft: -overlap,
                border: `${px(2)}px solid ${t.cardBg}`,
                objectFit: "cover",
                opacity: enter,
                transform: `scale(${0.6 + enter * 0.4}) translateY(${(1 - enter) * 8}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function SlotNumber({
  value,
  digitHeight,
  color,
  targetWidth,
}: {
  value: number;
  digitHeight: number;
  color: string;
  targetWidth: number;
}) {
  // Render `targetWidth` digit columns. Pad with leading zeros (but show
  // them in transparent so the visual width stays stable as the number rolls).
  const padded = Math.max(0, Math.floor(value))
    .toString()
    .padStart(targetWidth, "0");
  // Per-digit fractional value so each column rolls smoothly.
  // For digit position p (counted from right, 0 = units):
  //   fractional digit = (value / 10^p) mod 10
  return (
    <span
      style={{
        display: "inline-flex",
        height: digitHeight,
        fontFamily: "inherit",
        fontWeight: 800,
        fontSize: digitHeight * 0.85,
        color,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}
    >
      {padded.split("").map((_ch, i) => {
        const positionFromRight = targetWidth - 1 - i;
        const fractional = (value / 10 ** positionFromRight) % 10;
        // For leading positions where the integer part is zero (e.g. "0042"
        // when actual value is 42), render them transparent so width stays.
        const integerSoFar = Math.floor(value / 10 ** positionFromRight);
        const isLeadingZero = integerSoFar === 0 && positionFromRight > 0;
        return (
          <SlotDigit
            key={i}
            fractional={fractional}
            digitHeight={digitHeight}
            hidden={isLeadingZero}
          />
        );
      })}
    </span>
  );
}

function SlotDigit({
  fractional,
  digitHeight,
  hidden,
}: {
  fractional: number;
  digitHeight: number;
  hidden: boolean;
}) {
  // Build a 0..9 stack plus a trailing 0 so the wrap from 9→0 is smooth.
  const stack = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  const safe = ((fractional % 10) + 10) % 10;
  const offset = -safe * digitHeight;
  return (
    <span
      style={{
        display: "inline-block",
        width: digitHeight * 0.62,
        height: digitHeight,
        overflow: "hidden",
        verticalAlign: "top",
        opacity: hidden ? 0 : 1,
      }}
    >
      <span
        style={{
          display: "block",
          transform: `translateY(${offset}px)`,
          willChange: "transform",
        }}
      >
        {stack.map((d, i) => (
          <span
            key={i}
            style={{
              display: "block",
              height: digitHeight,
              lineHeight: `${digitHeight}px`,
              textAlign: "center",
            }}
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

function getDigitCount(n: number): number {
  return Math.max(1, Math.floor(Math.log10(Math.max(1, Math.abs(n)))) + 1);
}
