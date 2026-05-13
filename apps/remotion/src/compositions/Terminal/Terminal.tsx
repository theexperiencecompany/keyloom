"use client";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";

export type TerminalLineKind = "command" | "output" | "comment" | "success";

export type TerminalLine = {
  text: string;
  kind: TerminalLineKind;
};

export type TerminalProps = {
  title: string;
  prompt: string;
  lines: TerminalLine[];
  charactersPerSecond: number;
  lineGap: number;
  clipStyle?: ClipStyle;
};

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

const KIND_COLORS: Record<TerminalLineKind, string> = {
  command: "#f5f5f7",
  output: "rgba(245, 245, 247, 0.62)",
  comment: "rgba(245, 245, 247, 0.38)",
  success: "#34d399",
};

const PROMPT_COLOR = "#a78bfa";

export const Terminal: React.FC<TerminalProps> = ({
  title,
  prompt,
  lines,
  charactersPerSecond,
  lineGap,
  clipStyle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = resolveClipStyle(clipStyle, {
    background: "#0b0b0f",
    color: "#f5f5f7",
    fontFamily:
      "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
    accent: PROMPT_COLOR,
  });

  const framesPerChar = Math.max(1, Math.round(fps / charactersPerSecond));
  let cursorFrame = 12; // small breath after the window animates in

  const lineStarts: number[] = [];
  for (const line of lines) {
    lineStarts.push(cursorFrame);
    const advance =
      line.kind === "command" ? line.text.length * framesPerChar : 6;
    cursorFrame += advance + 8;
  }

  const windowReveal = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.7 },
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #1c1c22 0%, #0a0a0e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 96,
        fontFamily: s.fontFamily,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1280,
          borderRadius: 16,
          background: s.background,
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.06) inset",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
          opacity: windowReveal,
          transform: `translateY(${(1 - windowReveal) * 24}px) scale(${0.97 + windowReveal * 0.03})`,
        }}
      >
        <TerminalChrome title={title} />
        <div
          style={{
            padding: "28px 32px 36px",
            fontSize: 26,
            lineHeight: 1.55,
            color: s.color,
            minHeight: 320,
          }}
        >
          {lines.map((line, i) => (
            <TerminalRow
              key={i}
              line={line}
              prompt={prompt}
              startFrame={lineStarts[i] ?? 0}
              frame={frame}
              framesPerChar={framesPerChar}
              accent={s.accent}
              gap={lineGap}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

function TerminalChrome({ title }: { title: string }) {
  return (
    <div
      style={{
        height: 44,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <Dot color="#ff5f57" />
        <Dot color="#febc2e" />
        <Dot color="#28c840" />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, sans-serif",
          fontWeight: 500,
          color: "rgba(245,245,247,0.6)",
          letterSpacing: "-0.005em",
          pointerEvents: "none",
        }}
      >
        {title}
      </div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 13,
        height: 13,
        borderRadius: "50%",
        background: color,
        boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.18)",
      }}
    />
  );
}

function TerminalRow({
  line,
  prompt,
  startFrame,
  frame,
  framesPerChar,
  accent,
  gap,
}: {
  line: TerminalLine;
  prompt: string;
  startFrame: number;
  frame: number;
  framesPerChar: number;
  accent: string;
  gap: number;
}) {
  const elapsed = Math.max(0, frame - startFrame);
  const charsVisible =
    line.kind === "command"
      ? Math.min(line.text.length, Math.floor(elapsed / framesPerChar))
      : line.text.length;
  const visible = line.text.slice(0, charsVisible);
  const fullyTyped = charsVisible >= line.text.length;
  const showCursor = !fullyTyped && line.kind === "command";

  const fadeIn = interpolate(elapsed, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: APPLE_EASE,
  });
  if (frame < startFrame) return null;

  const color = KIND_COLORS[line.kind];

  return (
    <div
      style={{
        marginBottom: gap,
        opacity: line.kind === "command" ? 1 : fadeIn,
        transform:
          line.kind === "command"
            ? "none"
            : `translateY(${(1 - fadeIn) * 4}px)`,
        display: "flex",
        gap: 14,
        alignItems: "baseline",
      }}
    >
      {line.kind === "command" ? (
        <span style={{ color: accent, flexShrink: 0 }}>{prompt}</span>
      ) : line.kind === "success" ? (
        <span style={{ color, flexShrink: 0 }}>✓</span>
      ) : null}
      <span style={{ color, whiteSpace: "pre-wrap" }}>
        {visible}
        {showCursor && <Cursor />}
      </span>
    </div>
  );
}

function Cursor() {
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 16) % 2 === 0;
  return (
    <span
      style={{
        display: "inline-block",
        width: "0.55em",
        height: "1.05em",
        background: "currentColor",
        marginLeft: 2,
        transform: "translateY(0.2em)",
        opacity: blink ? 1 : 0,
      }}
    />
  );
}
