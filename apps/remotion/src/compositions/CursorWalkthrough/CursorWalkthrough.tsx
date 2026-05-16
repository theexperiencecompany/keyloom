"use client";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useVideoConfig,
} from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { proxyExternalImg } from "../../proxy-image";
import { useDesignFrame } from "../../use-design-frame";

export type CursorWalkthroughProps = {
  backgroundImageUrl: string;
  firstClickX: number;
  firstClickY: number;
  firstClickLabel: string;
  inputText: string;
  secondClickX: number;
  secondClickY: number;
  secondClickLabel: string;
  clipStyle?: ClipStyle;
};

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

const TRAVEL_1 = 32;
const CLICK_1 = 12;
const TYPE_DELAY = 10;
const FRAMES_PER_CHAR = 4;
const POST_TYPE_PAUSE = 20;
const TRAVEL_2 = 30;
const CLICK_2 = 12;

const RING_LIFETIME = 26;

export const CursorWalkthrough: React.FC<CursorWalkthroughProps> = ({
  backgroundImageUrl,
  firstClickX,
  firstClickY,
  firstClickLabel,
  inputText,
  secondClickX,
  secondClickY,
  secondClickLabel,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { width, height } = useVideoConfig();
  const s = resolveClipStyle(clipStyle, {
    background: "#ffffff",
    color: "#0f1014",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#0a84ff",
  });
  const accentColor = s.accent;

  const stage1End = TRAVEL_1;
  const stage2End = stage1End + CLICK_1;
  const stage3Start = stage2End + TYPE_DELAY;
  const stage3End = stage3Start + inputText.length * FRAMES_PER_CHAR;
  const stage4Start = stage3End + POST_TYPE_PAUSE;
  const stage4End = stage4Start + TRAVEL_2;
  const stage5End = stage4End + CLICK_2;

  const offX = width + 120;
  const offY = height + 120;

  let cursorX: number;
  let cursorY: number;
  if (frame < stage1End) {
    const p = interpolate(frame, [0, stage1End], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: APPLE_EASE,
    });
    cursorX = interpolate(p, [0, 1], [offX, firstClickX]);
    cursorY = interpolate(p, [0, 1], [offY, firstClickY]);
  } else if (frame < stage4Start) {
    cursorX = firstClickX;
    cursorY = firstClickY;
  } else if (frame < stage4End) {
    const p = interpolate(frame, [stage4Start, stage4End], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: APPLE_EASE,
    });
    cursorX = interpolate(p, [0, 1], [firstClickX, secondClickX]);
    cursorY = interpolate(p, [0, 1], [firstClickY, secondClickY]);
  } else {
    cursorX = secondClickX;
    cursorY = secondClickY;
  }

  const click1Pressed = frame >= stage1End && frame < stage2End;
  const click2Pressed = frame >= stage4End && frame < stage5End;
  const cursorPressed = click1Pressed || click2Pressed;

  const ring1 = computeRing(frame, stage1End);
  const ring2 = computeRing(frame, stage4End);

  const charsTyped =
    frame < stage3Start
      ? 0
      : Math.min(
          inputText.length,
          Math.floor((frame - stage3Start) / FRAMES_PER_CHAR),
        );
  const visibleText = inputText.slice(0, charsTyped);
  const isTyping = frame >= stage3Start && frame < stage3End;
  const caretBlink =
    isTyping && Math.floor((frame - stage3Start) / 12) % 2 === 0;

  const showFirstLabel = frame >= stage1End && frame < stage3Start;
  const showTypeBox = frame >= stage2End;
  const showSecondLabel = frame >= stage4End;

  return (
    <AbsoluteFill style={{ background: s.background }}>
      {backgroundImageUrl.trim() && (
        <Img
          src={proxyExternalImg(backgroundImageUrl)}
          crossOrigin="anonymous"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      <ClickRing
        x={firstClickX}
        y={firstClickY}
        ring={ring1}
        color={accentColor}
      />

      {showFirstLabel && firstClickLabel.trim() && (
        <Tooltip
          x={firstClickX}
          y={firstClickY}
          text={firstClickLabel}
          startFrame={stage1End}
          frame={frame}
        />
      )}

      {showTypeBox && (
        <TypeOverlay
          x={firstClickX}
          y={firstClickY}
          text={visibleText}
          caretVisible={caretBlink}
        />
      )}

      <ClickRing
        x={secondClickX}
        y={secondClickY}
        ring={ring2}
        color={accentColor}
      />

      {showSecondLabel && secondClickLabel.trim() && (
        <Tooltip
          x={secondClickX}
          y={secondClickY}
          text={secondClickLabel}
          startFrame={stage4End}
          frame={frame}
        />
      )}

      <MouseCursor x={cursorX} y={cursorY} pressed={cursorPressed} />
    </AbsoluteFill>
  );
};

function computeRing(frame: number, clickFrame: number) {
  const elapsed = frame - clickFrame;
  if (elapsed < 0 || elapsed > RING_LIFETIME) {
    return { scale: 0, opacity: 0 };
  }
  return {
    scale: interpolate(elapsed, [0, RING_LIFETIME], [1, 2.6]),
    opacity: interpolate(elapsed, [0, RING_LIFETIME], [0.55, 0]),
  };
}

function ClickRing({
  x,
  y,
  ring,
  color,
}: {
  x: number;
  y: number;
  ring: { scale: number; opacity: number };
  color: string;
}) {
  if (ring.opacity <= 0) return null;
  const size = 90 * ring.scale;
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        border: `4px solid ${color}`,
        opacity: ring.opacity,
        pointerEvents: "none",
      }}
    />
  );
}

function Tooltip({
  x,
  y,
  text,
  startFrame,
  frame,
}: {
  x: number;
  y: number;
  text: string;
  startFrame: number;
  frame: number;
}) {
  const fade = interpolate(frame, [startFrame, startFrame + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: APPLE_EASE,
  });
  const lift = (1 - fade) * 10;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y - 80,
        transform: `translate(-50%, ${-lift}px)`,
        background: "#0f1014",
        color: "#ffffff",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
        fontSize: 24,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        padding: "10px 18px",
        borderRadius: 10,
        boxShadow: "0 10px 28px rgba(15,16,20,0.25)",
        opacity: fade,
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {text}
    </div>
  );
}

function TypeOverlay({
  x,
  y,
  text,
  caretVisible,
}: {
  x: number;
  y: number;
  text: string;
  caretVisible: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + 32,
        transform: "translateX(-30%)",
        background: "#ffffff",
        borderRadius: 14,
        padding: "16px 22px",
        boxShadow:
          "0 16px 40px rgba(15,16,20,0.18), 0 2px 8px rgba(15,16,20,0.08)",
        border: "1px solid rgba(15,16,20,0.08)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
        fontSize: 36,
        fontWeight: 500,
        color: "#0f1014",
        letterSpacing: "-0.005em",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        minWidth: 100,
        pointerEvents: "none",
      }}
    >
      <span>{text || <span style={{ opacity: 0.35 }}>type…</span>}</span>
      <span
        style={{
          display: "inline-block",
          width: 3,
          height: 38,
          marginLeft: 4,
          background: "#0f1014",
          opacity: caretVisible ? 1 : 0,
          borderRadius: 1,
        }}
      />
    </div>
  );
}

function MouseCursor({
  x,
  y,
  pressed,
}: {
  x: number;
  y: number;
  pressed: boolean;
}) {
  const scale = pressed ? 0.85 : 1;
  return (
    <svg
      viewBox="0 0 24 24"
      width={64}
      height={64}
      style={{
        position: "absolute",
        left: x - 12,
        top: y - 8,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        filter: "drop-shadow(0 10px 22px rgba(15,16,20,0.32))",
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
