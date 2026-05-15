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
import { useDesignFrame } from "../../use-design-frame";

export type TypingComposerProps = {
  query: string;
  placeholder: string;
  clipStyle?: ClipStyle;
};

const BAR_APPEAR_START = 0;
const TYPING_START = 30;
const FRAMES_PER_CHAR = 4;
const POST_TYPE_PAUSE = 18;
const CURSOR_TRAVEL = 30;
const CLICK_FEEDBACK = 10;
const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

// GAIA pixel values × SCALE. Same proportions as the real composer, sized
// for the 1920×1080 motion-studio canvas.
const SCALE = 2;

const BAR_WIDTH = 640 * SCALE;
const RADIUS_3XL = 24 * SCALE;
const PAD_1 = 4 * SCALE;
const PAD_2 = 8 * SCALE;
const PAD_3 = 12 * SCALE;
const GAP_2 = 8 * SCALE;
const ML_2 = 8 * SCALE;

const TEXTAREA_MIN_HEIGHT = 52 * SCALE;
const TEXTAREA_LINE_HEIGHT_PX = 24 * SCALE;
const TEXTAREA_FONT_SIZE = 16 * SCALE;
const TEXTAREA_PAD_Y = 10 * SCALE;

const BTN_SIZE = 36 * SCALE;

const PLUS_ICON = 23 * SCALE;
const TOOLS_ICON = 22 * SCALE;
const SEND_ICON = 22 * SCALE;

// GAIA color tokens.
const ZINC_800 = "#27272a";
const ZINC_700 = "#3f3f46";
const ZINC_400 = "#a1a1aa";
const PLACEHOLDER_COLOR = "#a1a1aa";

export const TypingComposer: React.FC<TypingComposerProps> = ({
  query,
  placeholder,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { fps, width, height } = useVideoConfig();
  const s = resolveClipStyle(clipStyle, {
    background: "#111111",
    color: "#ffffff",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    accent: "#00bbff",
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
  const hasText = charsTyped > 0;

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
  const sendScale = clickActive ? 0.9 : 1;

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
    isTyping && Math.floor((frame - TYPING_START) / 10) % 2 === 0;

  // Word-wrap typed text into lines that fit the textarea.
  const textareaContentWidth = BAR_WIDTH - PAD_1 * 2 - PAD_3 * 2;
  const charsPerLine = Math.max(
    20,
    Math.floor(textareaContentWidth / (TEXTAREA_FONT_SIZE * 0.55)),
  );
  const lines = wrapText(visibleText, charsPerLine);
  const renderedLineCount = Math.max(1, lines.length || 1);
  const textareaHeight = Math.max(
    TEXTAREA_MIN_HEIGHT,
    renderedLineCount * TEXTAREA_LINE_HEIGHT_PX + TEXTAREA_PAD_Y * 2,
  );
  const toolbarHeight = BTN_SIZE;
  const barHeight = PAD_1 + textareaHeight + PAD_1 + toolbarHeight + PAD_2;

  const barLeft = (width - BAR_WIDTH) / 2;
  const barTop = (height - barHeight) / 2;

  const sendCenterX = barLeft + BAR_WIDTH - PAD_1 - PAD_2 - BTN_SIZE / 2;
  const sendCenterY = barTop + barHeight - PAD_2 - BTN_SIZE / 2;

  const cursorStartX = width + 80;
  const cursorStartY = height + 80;
  const cursorX = interpolate(
    cursorProgress,
    [0, 1],
    [cursorStartX, sendCenterX - 4],
  );
  const cursorY = interpolate(
    cursorProgress,
    [0, 1],
    [cursorStartY, sendCenterY - 2],
  );
  const cursorVisible = frame >= cursorStart;

  const sendBg = hasText ? accentColor : ZINC_700;
  const sendIconColor = hasText ? "#000000" : ZINC_400;

  return (
    <AbsoluteFill
      style={{
        background: s.background,
        fontFamily: s.fontFamily,
      }}
    >
      {/* searchbar — bg-zinc-800 rounded-3xl px-1 pt-1 pb-2 */}
      <div
        style={{
          position: "absolute",
          left: barLeft,
          top: barTop,
          width: BAR_WIDTH,
          minHeight: barHeight,
          background: ZINC_800,
          borderRadius: RADIUS_3XL,
          paddingLeft: PAD_1,
          paddingRight: PAD_1,
          paddingTop: PAD_1,
          paddingBottom: PAD_2,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          opacity: barProgress,
          transform: `translate3d(0, ${snap((1 - barProgress) * 22)}px, 0) scale(${0.97 + barProgress * 0.03})`,
        }}
      >
        {/* HeroUI Textarea (size=lg) — inputWrapper px-3 with extra body padding */}
        <div
          style={{
            display: "flex",
            alignItems: renderedLineCount > 1 ? "flex-start" : "center",
            paddingLeft: PAD_3,
            paddingRight: PAD_3,
            minHeight: TEXTAREA_MIN_HEIGHT,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              flex: 1,
              fontSize: TEXTAREA_FONT_SIZE,
              lineHeight: `${TEXTAREA_LINE_HEIGHT_PX}px`,
              fontWeight: 300,
              color: "#ffffff",
              letterSpacing: "-0.005em",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              minWidth: 0,
              paddingTop: TEXTAREA_PAD_Y,
              paddingBottom: TEXTAREA_PAD_Y,
            }}
          >
            {!hasText ? (
              <span style={{ color: PLACEHOLDER_COLOR, fontWeight: 300 }}>
                {placeholder}
              </span>
            ) : (
              lines.map((line, i) => (
                <span key={i} style={{ display: "block" }}>
                  {line}
                  {i === lines.length - 1 ? (
                    <span
                      style={{
                        display: "inline-block",
                        width: 2 * SCALE,
                        height: TEXTAREA_FONT_SIZE,
                        marginLeft: 3 * SCALE,
                        verticalAlign: "text-bottom",
                        background: "#ffffff",
                        opacity: caretBlink ? 1 : 0,
                        borderRadius: 1,
                      }}
                    />
                  ) : null}
                </span>
              ))
            )}
          </div>
        </div>

        {/* ComposerToolbar — flex justify-between px-2 pt-1 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: PAD_2,
            paddingRight: PAD_2,
            paddingTop: PAD_1,
          }}
        >
          {/* ComposerLeft — flex gap-2 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: GAP_2,
            }}
          >
            <RoundButton size={BTN_SIZE} bg={ZINC_700}>
              <PlusSignSolid size={PLUS_ICON} color={ZINC_400} />
            </RoundButton>
            <RoundButton size={BTN_SIZE} bg={ZINC_700}>
              <ToolsSolid size={TOOLS_ICON} color={ZINC_400} />
            </RoundButton>
          </div>

          {/* ComposerRight — ml-2 gap-2 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginLeft: ML_2,
              gap: GAP_2,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: BTN_SIZE,
                height: BTN_SIZE,
                borderRadius: "50%",
                border: `${2 * SCALE}px solid ${accentColor}`,
                transform: `scale(${ringScale})`,
                opacity: ringOpacity,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                width: BTN_SIZE,
                height: BTN_SIZE,
                minWidth: BTN_SIZE,
                minHeight: BTN_SIZE,
                maxWidth: BTN_SIZE,
                borderRadius: "50%",
                background: sendBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${sendScale})`,
              }}
            >
              <ArrowUp02Solid size={SEND_ICON} color={sendIconColor} />
            </div>
          </div>
        </div>
      </div>

      {cursorVisible && <MouseCursor x={cursorX} y={cursorY} />}
    </AbsoluteFill>
  );
};

function wrapText(text: string, maxChars: number): string[] {
  if (!text) return [];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function RoundButton({
  size,
  bg,
  children,
}: {
  size: number;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        height: size,
        width: size,
        minWidth: size,
        minHeight: size,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
}

// GAIA solid-rounded icon paths (1:1 with @theexperiencecompany/gaia-icons).

function PlusSignSolid({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      stroke="none"
    >
      <path
        fillRule="evenodd"
        d="M12 2.75C12.6904 2.75 13.25 3.30964 13.25 4V10.75H20C20.6904 10.75 21.25 11.3096 21.25 12C21.25 12.6904 20.6904 13.25 20 13.25H13.25V20C13.25 20.6904 12.6904 21.25 12 21.25C11.3096 21.25 10.75 20.6904 10.75 20V13.25H4C3.30964 13.25 2.75 12.6904 2.75 12C2.75 11.3096 3.30964 10.75 4 10.75H10.75V4C10.75 3.30964 11.3096 2.75 12 2.75Z"
      />
    </svg>
  );
}

function ToolsSolid({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      stroke="none"
    >
      <path d="M19.1141 2.8569C19.4092 2.67983 19.787 2.72634 20.0303 2.96969L21.0303 3.96969C21.2737 4.21304 21.3202 4.59078 21.1431 4.88589L19.6431 7.38589C19.5243 7.58393 19.3209 7.71618 19.0916 7.7444C18.8624 7.77262 18.633 7.69365 18.4697 7.53035L16.4697 5.53035C16.3064 5.36704 16.2274 5.1376 16.2556 4.90838C16.2838 4.67916 16.4161 4.47572 16.6141 4.3569L19.1141 2.8569Z" />
      <path d="M5.89339 2.29331C7.17125 2.10989 8.52011 2.50977 9.50516 3.49481C10.6071 4.59679 10.9766 6.15237 10.6167 7.55804L16.4419 13.3833C17.8476 13.0234 19.4032 13.3928 20.5052 14.4948C21.4902 15.4799 21.8901 16.8287 21.7067 18.1066C21.6663 18.3877 21.4706 18.6219 21.2012 18.7116C20.9318 18.8013 20.6347 18.7312 20.4339 18.5303L19.0318 17.1282H17.25V19.1537L18.5303 20.434C18.7311 20.6348 18.8013 20.9318 18.7115 21.2013C18.6218 21.4707 18.3876 21.6664 18.1065 21.7067C16.8287 21.8901 15.4798 21.4903 14.4948 20.5052C13.3936 19.4041 13.0239 17.8499 13.3824 16.4451L7.55486 10.6175C6.15002 10.9761 4.59591 10.6064 3.49475 9.50522C2.5097 8.52017 2.10983 7.17131 2.29325 5.89345C2.3336 5.61235 2.52927 5.37814 2.79871 5.28843C3.06816 5.19871 3.36516 5.26888 3.56597 5.46969L4.8463 6.75002H6.87175V4.96816L5.46963 3.56603C5.26882 3.36522 5.19865 3.06822 5.28836 2.79877C5.37808 2.52933 5.61229 2.33366 5.89339 2.29331Z" />
      <path d="M7.7032 12.5332L3.36553 16.8708C2.54482 17.6916 2.54482 19.0222 3.36553 19.8429L4.15725 20.6346C4.97796 21.4553 6.30859 21.4553 7.1293 20.6346L11.467 16.2969L7.7032 12.5332Z" />
      <path d="M13.8809 9.05569L14.9415 10.1163L18.5285 6.52938L17.4678 5.46872L13.8809 9.05569Z" />
    </svg>
  );
}

function ArrowUp02Solid({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      stroke="none"
    >
      <path d="M12.9999 19.002C12.9999 19.5542 12.5522 20.002 11.9999 20.002C11.4476 20.0019 10.9999 19.5542 10.9999 19.002V6.74121C10.4264 7.25563 9.78116 7.94409 9.16198 8.65723C8.52607 9.38966 7.93619 10.1256 7.50378 10.6797C7.2881 10.9561 6.86131 11.5134 6.74011 11.6738C6.39996 12.0494 5.82401 12.1144 5.4071 11.8076C4.9626 11.4802 4.86709 10.8538 5.19421 10.4092C5.32082 10.2415 5.70349 9.73516 5.92663 9.44922C6.37213 8.87836 6.9859 8.11413 7.65222 7.34668C8.31419 6.58424 9.04804 5.79591 9.73327 5.19043C10.0746 4.8888 10.4273 4.61078 10.7714 4.40332C11.0881 4.2124 11.5238 4.00198 11.9999 4.00195L12.1766 4.01172C12.5829 4.05466 12.9504 4.23637 13.2274 4.40332C13.5716 4.61079 13.925 4.88871 14.2665 5.19043C14.9517 5.7959 15.6856 6.58427 16.3475 7.34668C17.0138 8.1141 17.6276 8.87836 18.0731 9.44922C18.2962 9.73513 18.6789 10.2415 18.8055 10.4092C19.1327 10.8538 19.0372 11.4792 18.5926 11.8066C18.1757 12.1137 17.5999 12.0496 17.2596 11.6738C17.2596 11.6738 17.0692 11.4269 17.0087 11.3467C16.8875 11.1862 16.7117 10.9561 16.496 10.6797C16.0635 10.1256 15.4737 9.38965 14.8378 8.65723C14.2185 7.94406 13.5734 7.25564 12.9999 6.74121V19.002Z" />
    </svg>
  );
}

function MouseCursor({ x, y }: { x: number; y: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={88}
      height={88}
      style={{
        position: "absolute",
        left: x - 16,
        top: y - 10,
        filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.5))",
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
