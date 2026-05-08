"use client";
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  LockIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type BrowserWindowProps = {
  url: string;
  pageImageUrl: string;
  pageBackgroundColor: string;
  backgroundColor: string;
};

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

const URL_TYPE_START = 28;
const FRAMES_PER_CHAR = 3;
const PAGE_FADE_DELAY = 14;
const PAGE_FADE_DURATION = 26;

const WINDOW_WIDTH = 1700;
const WINDOW_HEIGHT = 960;
const TITLE_BAR_HEIGHT = 86;

export const BrowserWindow: React.FC<BrowserWindowProps> = ({
  url,
  pageImageUrl,
  pageBackgroundColor,
  backgroundColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const windowEnter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 110, mass: 0.7 },
  });

  const typingDuration = url.length * FRAMES_PER_CHAR;
  const typingEnd = URL_TYPE_START + typingDuration;
  const charsTyped =
    frame < URL_TYPE_START
      ? 0
      : Math.min(
          url.length,
          Math.floor((frame - URL_TYPE_START) / FRAMES_PER_CHAR),
        );
  const visibleUrl = url.slice(0, charsTyped);
  const isTyping = frame >= URL_TYPE_START && frame < typingEnd;
  const caretBlink =
    isTyping && Math.floor((frame - URL_TYPE_START) / 12) % 2 === 0;

  const pageStart = typingEnd + PAGE_FADE_DELAY;
  const pageOpacity = interpolate(
    frame,
    [pageStart, pageStart + PAGE_FADE_DURATION],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: APPLE_EASE,
    },
  );
  const pageLift = interpolate(
    frame,
    [pageStart, pageStart + PAGE_FADE_DURATION],
    [12, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: APPLE_EASE,
    },
  );

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
          width: WINDOW_WIDTH,
          height: WINDOW_HEIGHT,
          background: "#ffffff",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow:
            "0 40px 100px rgba(15,16,20,0.18), 0 8px 24px rgba(15,16,20,0.08)",
          border: "1px solid rgba(15,16,20,0.06)",
          opacity: windowEnter,
          transform: `translateY(${(1 - windowEnter) * 28}px) scale(${0.97 + windowEnter * 0.03})`,
          willChange: "transform, opacity",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TitleBar
          url={visibleUrl}
          isTyping={isTyping}
          caretVisible={caretBlink}
        />
        <div
          style={{
            flex: 1,
            background: pageBackgroundColor,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: pageOpacity,
              transform: `translateY(${pageLift}px)`,
              willChange: "transform, opacity",
            }}
          >
            {pageImageUrl.trim() ? (
              <Img
                src={pageImageUrl}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

function TitleBar({
  url,
  isTyping,
  caretVisible,
}: {
  url: string;
  isTyping: boolean;
  caretVisible: boolean;
}) {
  return (
    <div
      style={{
        height: TITLE_BAR_HEIGHT,
        background: "#f4f4f5",
        borderBottom: "1px solid rgba(15,16,20,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "0 22px",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <TrafficLight color="#ff5f57" />
        <TrafficLight color="#febc2e" />
        <TrafficLight color="#28c840" />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <NavButton icon={ArrowLeft02Icon} />
        <NavButton icon={ArrowRight02Icon} />
        <NavButton icon={RefreshIcon} />
      </div>

      <div
        style={{
          flex: 1,
          height: 48,
          background: "#ffffff",
          border: "1px solid rgba(15,16,20,0.10)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 18px",
        }}
      >
        <HugeiconsIcon icon={LockIcon} size={18} color="rgba(15,16,20,0.55)" />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            fontSize: 22,
            color: "#0f1014",
            letterSpacing: "-0.005em",
            fontWeight: 400,
            minWidth: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <span>{url}</span>
          {isTyping && (
            <span
              style={{
                display: "inline-block",
                width: 2,
                height: 26,
                marginLeft: 3,
                background: "#0f1014",
                opacity: caretVisible ? 1 : 0,
                borderRadius: 1,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TrafficLight({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: color,
      }}
    />
  );
}

function NavButton({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
}) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <HugeiconsIcon icon={icon} size={20} color="rgba(15,16,20,0.55)" />
    </div>
  );
}
