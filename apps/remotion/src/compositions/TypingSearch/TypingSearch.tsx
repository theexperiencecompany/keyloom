"use client";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { snap } from "../../snap";
import { useCanvasLayout } from "../../use-canvas-layout";
import { useDesignFrame } from "../../use-design-frame";

export type TypingSearchProps = {
  query: string;
  placeholder: string;
  clipStyle?: ClipStyle;
};

const BAR_APPEAR_START = 0;
const TYPING_START = 30;
const FRAMES_PER_CHAR = 5;
const POST_TYPE_PAUSE = 18;
const CURSOR_TRAVEL = 30;
const CLICK_FEEDBACK = 10;
const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const TypingSearch: React.FC<TypingSearchProps> = ({
  query,
  placeholder,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();
  const { width, height, vw, vh, vmin } = useCanvasLayout();
  // The search bar was authored against a 1920×1080 canvas (min side 1080).
  // Convert authored px → canvas-relative units so the whole pill reflows to
  // any aspect instead of uniformly shrinking. The cursor-fly-in target is
  // recomputed from these relative sizes below so the click still lands on the
  // button in every format.
  const r = (px: number) => vmin((px / 1080) * 100);

  // The pill was a fixed 1700px box centered on a 1920-wide canvas. Size it
  // relative to the canvas and cap it so it fits portrait AND landscape.
  const BAR_WIDTH = Math.min(vw(88), vh(160), r(1700));
  const BAR_HEIGHT = r(200);
  const BUTTON_SIZE = r(144);
  const BUTTON_PADDING = r(22);

  const s = resolveClipStyle(clipStyle, {
    background: "#ffffff",
    color: "#0f1014",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#0a84ff",
  });
  const accentColor = s.accent;

  const barProgress = spring({
    frame: frame - BAR_APPEAR_START,
    fps,
    config: { damping: 15, stiffness: 100, mass: 0.7 },
  });

  const typingDuration = query.length * FRAMES_PER_CHAR;
  const typingEnd = TYPING_START + typingDuration;
  const charsTyped =
    frame < TYPING_START
      ? 0
      : Math.min(
          query.length,
          Math.floor((frame - TYPING_START) / FRAMES_PER_CHAR),
        );
  const visibleText = query.slice(0, charsTyped);
  const isTyping = frame >= TYPING_START && frame < typingEnd;

  const cursorStart = typingEnd + POST_TYPE_PAUSE;
  const cursorEnd = cursorStart + CURSOR_TRAVEL;
  const cursorProgress = interpolate(frame, [cursorStart, cursorEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: APPLE_EASE,
  });

  const clickStart = cursorEnd;
  const clickActive =
    frame >= clickStart && frame < clickStart + CLICK_FEEDBACK;
  const buttonScale = clickActive ? 0.9 : 1;

  const ringScale = interpolate(
    frame,
    [clickStart, clickStart + CLICK_FEEDBACK + 8],
    [1, 1.9],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const ringOpacity = interpolate(
    frame,
    [clickStart, clickStart + CLICK_FEEDBACK + 8],
    [0.45, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const caretBlink =
    isTyping && Math.floor((frame - TYPING_START) / 12) % 2 === 0;

  const barLeft = (width - BAR_WIDTH) / 2;
  const barTop = (height - BAR_HEIGHT) / 2;
  const buttonCenterX = barLeft + BAR_WIDTH - BUTTON_PADDING - BUTTON_SIZE / 2;
  const buttonCenterY = barTop + BAR_HEIGHT / 2;

  const cursorStartX = width + 80;
  const cursorStartY = height + 80;
  const cursorX = interpolate(
    cursorProgress,
    [0, 1],
    [cursorStartX, buttonCenterX - 4],
  );
  const cursorY = interpolate(
    cursorProgress,
    [0, 1],
    [cursorStartY, buttonCenterY - 2],
  );
  const cursorVisible = frame >= cursorStart;

  return (
    <AbsoluteFill
      style={{ background: s.background, fontFamily: s.fontFamily }}
    >
      <div
        style={{
          position: "absolute",
          left: barLeft,
          top: barTop,
          width: BAR_WIDTH,
          height: BAR_HEIGHT,
          background: "#ffffff",
          borderRadius: BAR_HEIGHT / 2,
          boxShadow:
            "0 14px 44px rgba(15,16,20,0.10), 0 2px 8px rgba(15,16,20,0.05)",
          border: "1px solid rgba(15,16,20,0.06)",
          display: "flex",
          alignItems: "center",
          gap: r(28),
          padding: `0 ${BUTTON_PADDING}px 0 ${r(56)}px`,
          opacity: barProgress,
          transform: `translate3d(0, ${snap((1 - barProgress) * 18)}px, 0) scale(${0.96 + barProgress * 0.04})`,
        }}
      >
        <SearchIcon size={r(56)} />

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            fontSize: r(64),
            fontWeight: 500,
            color: "#0f1014",
            letterSpacing: "-0.015em",
            minWidth: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {charsTyped === 0 ? (
            <span style={{ color: "rgba(15,16,20,0.35)" }}>{placeholder}</span>
          ) : (
            <>
              <span>{visibleText}</span>
              <span
                style={{
                  display: "inline-block",
                  width: r(4),
                  height: r(68),
                  marginLeft: r(6),
                  background: "#0f1014",
                  opacity: caretBlink ? 1 : 0,
                  borderRadius: 1,
                }}
              />
            </>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `${r(3)}px solid ${accentColor}`,
              transform: `scale(${ringScale})`,
              opacity: ringOpacity,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
              borderRadius: "50%",
              background: accentColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              transform: `scale(${buttonScale})`,
            }}
          >
            <ArrowIcon size={r(56)} />
          </div>
        </div>
      </div>

      {cursorVisible && <MouseCursor x={cursorX} y={cursorY} size={r(88)} />}
    </AbsoluteFill>
  );
};

function SearchIcon({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="rgba(15,16,20,0.55)"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function ArrowIcon({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

function MouseCursor({ x, y, size }: { x: number; y: number; size: number }) {
  // The pointer tip sits at ~(16,10) within the 88-unit artboard; keep the same
  // fractional offset so the tip lands on the target at any cursor size.
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{
        position: "absolute",
        left: x - size * (16 / 88),
        top: y - size * (10 / 88),
        filter: "drop-shadow(0 10px 20px rgba(15,16,20,0.3))",
        pointerEvents: "none",
      }}
    >
      <path
        d="M5 3 L5 19 L9 15 L11.5 21 L13.5 20.2 L11 14.2 L17.5 14 Z"
        fill="#ffffff"
        stroke="#0f1014"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}
