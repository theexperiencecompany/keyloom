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
  staticFile,
  useVideoConfig,
} from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { proxyExternalImg } from "../../proxy-image";
import { snap } from "../../snap";
import { useCanvasLayout } from "../../use-canvas-layout";
import { useDesignFrame } from "../../use-design-frame";

// Remotion's bundle server only serves public/ assets through staticFile() —
// literal "/foo.png" strings fail with 404 inside `remotion render`. Resolve
// bare paths through staticFile() and let proxyExternalImg handle absolute
// http(s) URLs (which need to go through the /api/img/ proxy so the export
// canvas stays untainted).
function resolveAsset(src: string): string {
  if (!src) return src;
  if (/^(data:|blob:)/i.test(src)) return src;
  if (/^https?:/i.test(src)) return proxyExternalImg(src);
  return staticFile(src.replace(/^\//, ""));
}

export type BrowserWindowProps = {
  url: string;
  pageImageUrl: string;
  pageBackgroundColor: string;
  clipStyle?: ClipStyle;
};

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

const URL_TYPE_START = 28;
const FRAMES_PER_CHAR = 3;
const PAGE_FADE_DELAY = 14;
const PAGE_FADE_DURATION = 26;

// The window's natural aspect ratio (was 1700×960 in the original design).
const WINDOW_ASPECT = 1700 / 960;

export const BrowserWindow: React.FC<BrowserWindowProps> = ({
  url,
  pageImageUrl,
  pageBackgroundColor,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();
  const { vw, vh, vmin } = useCanvasLayout();
  const s = resolveClipStyle(clipStyle, {
    background: "#ffffff",
    color: "#0f1014",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#0a84ff",
  });

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

  // Fit the window into the canvas (minus padding) while keeping its natural
  // aspect ratio, so it reflows to fill any orientation instead of shrinking.
  const pad = vmin(5.5);
  const availW = vw(100) - pad * 2;
  const availH = vh(100) - pad * 2;
  const windowW = Math.min(availW, availH * WINDOW_ASPECT);
  const windowH = windowW / WINDOW_ASPECT;
  // Chrome scales with the window so it stays proportional in every aspect.
  const chrome = windowH * 0.09;

  return (
    <AbsoluteFill
      style={{
        background: s.background,
        fontFamily: s.fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: pad,
      }}
    >
      <div
        style={{
          width: windowW,
          height: windowH,
          background: "#ffffff",
          borderRadius: windowH * 0.019,
          overflow: "hidden",
          boxShadow:
            "0 40px 100px rgba(15,16,20,0.18), 0 8px 24px rgba(15,16,20,0.08)",
          border: "1px solid rgba(15,16,20,0.06)",
          opacity: windowEnter,
          transform: `translate3d(0, ${snap((1 - windowEnter) * 28)}px, 0) scale(${0.97 + windowEnter * 0.03})`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TitleBar
          url={visibleUrl}
          isTyping={isTyping}
          caretVisible={caretBlink}
          barHeight={chrome}
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
              transform: `translate3d(0, ${snap(pageLift)}px, 0)`,
            }}
          >
            {pageImageUrl.trim() ? (
              <Img
                src={resolveAsset(pageImageUrl)}
                crossOrigin="anonymous"
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
  barHeight,
}: {
  url: string;
  isTyping: boolean;
  caretVisible: boolean;
  barHeight: number;
}) {
  // Everything inside scales off the bar height (was 86px in the original
  // 1700×960 design), so the chrome stays proportional at any canvas size.
  const u = barHeight / 86;
  return (
    <div
      style={{
        height: barHeight,
        background: "#f4f4f5",
        borderBottom: "1px solid rgba(15,16,20,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 18 * u,
        padding: `0 ${22 * u}px`,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 * u }}>
        <TrafficLight color="#ff5f57" size={16 * u} />
        <TrafficLight color="#febc2e" size={16 * u} />
        <TrafficLight color="#28c840" size={16 * u} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 * u }}>
        <NavButton icon={ArrowLeft02Icon} u={u} />
        <NavButton icon={ArrowRight02Icon} u={u} />
        <NavButton icon={RefreshIcon} u={u} />
      </div>

      <div
        style={{
          flex: 1,
          height: 48 * u,
          background: "#ffffff",
          border: "1px solid rgba(15,16,20,0.10)",
          borderRadius: 12 * u,
          display: "flex",
          alignItems: "center",
          gap: 12 * u,
          padding: `0 ${18 * u}px`,
        }}
      >
        <HugeiconsIcon
          icon={LockIcon}
          size={18 * u}
          color="rgba(15,16,20,0.55)"
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            fontSize: 22 * u,
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
                width: 2 * u,
                height: 26 * u,
                marginLeft: 3 * u,
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

function TrafficLight({ color, size }: { color: string; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
      }}
    />
  );
}

function NavButton({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon,
  u,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  u: number;
}) {
  return (
    <div
      style={{
        width: 36 * u,
        height: 36 * u,
        borderRadius: 8 * u,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <HugeiconsIcon icon={icon} size={20 * u} color="rgba(15,16,20,0.55)" />
    </div>
  );
}
