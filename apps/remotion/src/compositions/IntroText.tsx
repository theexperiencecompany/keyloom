import { AbsoluteFill, spring, useVideoConfig } from "remotion";
import { useDesignFrame } from "../use-design-frame";

export const INTRO_TEXT_DURATION = 300; // 5s @ 60fps
export const INTRO_TEXT_FPS = 60;
export const INTRO_TEXT_WIDTH = 1280;
export const INTRO_TEXT_HEIGHT = 720;

// ===== CONTENT =====
const LINES = ["hello.", "i'm sanku.", "let's build something."];

// ===== TYPING TIMING =====
const TYPE_START = 6; // frame when typing begins
const FRAMES_PER_CHAR = 2.5; // typing speed
const PAUSE_BETWEEN_LINES = 22; // hold after each line completes
const CURSOR_BLINK_FRAMES = 28; // blink full cycle (on + off)

// Pre-compute: for each line, the start frame, end frame
type LineTiming = { start: number; end: number; len: number };

function computeTimings(lines: string[]): LineTiming[] {
  const out: LineTiming[] = [];
  let cursor = TYPE_START;
  for (const line of lines) {
    const start = cursor;
    const end = start + line.length * FRAMES_PER_CHAR;
    out.push({ start, end, len: line.length });
    cursor = end + PAUSE_BETWEEN_LINES;
  }
  return out;
}

const TIMINGS = computeTimings(LINES);

export const IntroText: React.FC = () => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();

  // Cursor blink: simple on/off based on frame mod
  const blinkPhase = (frame % CURSOR_BLINK_FRAMES) / CURSOR_BLINK_FRAMES;
  const cursorVisible = blinkPhase < 0.5;

  // Determine which line is "active" (currently typing or last finished)
  let activeLineIdx = 0;
  for (let i = 0; i < TIMINGS.length; i++) {
    if (frame >= TIMINGS[i]!.start) activeLineIdx = i;
  }

  return (
    <AbsoluteFill
      style={{
        background: "#f5f5f0",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
        color: "#0a0b0f",
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          alignItems: "flex-start",
          justifyContent: "center",
          flexDirection: "column",
          padding: "0 120px",
          gap: 8,
        }}
      >
        {LINES.map((line, i) => {
          const t = TIMINGS[i]!;
          if (frame < t.start) return null;

          const charsTyped = Math.min(
            line.length,
            Math.floor((frame - t.start) / FRAMES_PER_CHAR),
          );
          const visibleText = line.slice(0, charsTyped);
          const isCurrentlyTyping =
            i === activeLineIdx && charsTyped < line.length;
          const isActiveLine = i === activeLineIdx;

          // Subtle line entry — soft fade to keep it premium
          const fadeIn = spring({
            frame: frame - t.start,
            fps,
            config: { damping: 22, stiffness: 100 },
          });

          return (
            <div
              key={i}
              style={{
                fontSize: 96,
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.15,
                color: "#0a0b0f",
                display: "flex",
                alignItems: "baseline",
                opacity: fadeIn,
              }}
            >
              <span>{visibleText}</span>
              {/* Cursor: shown on the line that's typing or just finished as active */}
              {(isCurrentlyTyping || (isActiveLine && cursorVisible)) && (
                <span
                  style={{
                    display: "inline-block",
                    width: "0.06em",
                    height: "0.85em",
                    marginLeft: "0.06em",
                    background: "#0a0b0f",
                    transform: "translateY(0.05em)",
                    opacity: isCurrentlyTyping ? 1 : cursorVisible ? 1 : 0,
                  }}
                />
              )}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
