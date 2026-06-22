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

export type TerminalLineKind = "command" | "output" | "comment" | "success";

export type TerminalLine = {
  text: string;
  kind: TerminalLineKind;
};

export type TerminalChromeStyle = "mac" | "linux" | "windows" | "none";
export type TerminalCursorStyle = "block" | "underline" | "bar";

export type TerminalProps = {
  title: string;
  prompt: string;
  lines: TerminalLine[];
  charactersPerSecond: number;
  lineGap: number;
  chromeStyle: TerminalChromeStyle;
  cursorStyle: TerminalCursorStyle;
  fontSize: number;
  paddingX: number;
  paddingY: number;
  cornerRadius: number;
  successColor: string;
  outputOpacity: number;
  commentOpacity: number;
  showShadow: boolean;
  maxWidth: number;
  clipStyle?: ClipStyle;
};

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

// The terminal window keeps its own dark surface regardless of the scene
// backdrop — same as TypingSearch's pill always being white. The universal
// "Background" control drives the scene behind the window, not the window fill.
const WINDOW_BG = "#0b0b0f";

export const Terminal: React.FC<TerminalProps> = ({
  title,
  prompt,
  lines,
  charactersPerSecond,
  lineGap,
  chromeStyle,
  cursorStyle,
  fontSize,
  paddingX,
  paddingY,
  cornerRadius,
  successColor,
  outputOpacity,
  commentOpacity,
  showShadow,
  maxWidth,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();
  const { vw, vh, vmin } = useCanvasLayout();
  // Design canvas was 1920×1080 (min side 1080). Convert authored px → relative
  // so the terminal window reflows to any aspect instead of uniformly shrinking.
  const r = (px: number) => vmin((px / 1080) * 100);
  const s = resolveClipStyle(clipStyle, {
    // Scene backdrop (behind the window). White by default to preserve the
    // current look; now user-controllable via the universal Background control.
    background: "#ffffff",
    color: "#f5f5f7",
    fontFamily:
      "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
    accent: "#9ca3af",
  });

  const kindColors: Record<TerminalLineKind, string> = {
    command: s.color,
    output: applyAlpha(s.color, outputOpacity),
    comment: applyAlpha(s.color, commentOpacity),
    success: successColor,
  };

  const framesPerChar = Math.max(1, Math.round(fps / charactersPerSecond));
  let cursorFrame = 12;

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

  // The window was width:100% capped at `maxWidth` inside a 96px gutter. Size it
  // relative to the canvas (capped at the scaled maxWidth) and center it so it
  // fits portrait AND landscape without overflowing.
  const windowWidth = Math.min(vw(88), vh(160), r(maxWidth));

  return (
    <AbsoluteFill
      style={{
        background: s.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: vmin(6),
        fontFamily: s.fontFamily,
      }}
    >
      <div
        style={{
          width: windowWidth,
          borderRadius: r(cornerRadius),
          background: WINDOW_BG,
          boxShadow: showShadow
            ? "0 30px 80px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.06) inset"
            : "none",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
          opacity: windowReveal,
          transform: `translate3d(0, ${snap((1 - windowReveal) * 24)}px, 0) scale(${0.97 + windowReveal * 0.03})`,
        }}
      >
        <TerminalChrome style={chromeStyle} title={title} r={r} />
        <div
          style={{
            padding: `${r(paddingY)}px ${r(paddingX)}px`,
            fontSize: r(fontSize),
            lineHeight: 1.55,
            color: s.color,
            minHeight: r(320),
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
              gap={r(lineGap)}
              color={kindColors[line.kind]}
              cursorStyle={cursorStyle}
              r={r}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

function TerminalChrome({
  style,
  title,
  r,
}: {
  style: TerminalChromeStyle;
  title: string;
  r: (px: number) => number;
}) {
  if (style === "none") return null;
  return (
    <div
      style={{
        height: r(44),
        display: "flex",
        alignItems: "center",
        padding: `0 ${r(16)}px`,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
      }}
    >
      <ChromeButtons style={style} r={r} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: r(14),
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

function ChromeButtons({
  style,
  r,
}: {
  style: TerminalChromeStyle;
  r: (px: number) => number;
}) {
  if (style === "mac") {
    return (
      <div style={{ display: "flex", gap: r(8) }}>
        <Dot color="#ff5f57" r={r} />
        <Dot color="#febc2e" r={r} />
        <Dot color="#28c840" r={r} />
      </div>
    );
  }
  if (style === "linux") {
    return (
      <div style={{ display: "flex", gap: r(8) }}>
        <Dot color="#888" r={r} />
        <Dot color="#aaa" r={r} />
        <Dot color="#ccc" r={r} />
      </div>
    );
  }
  // windows — three SVG glyphs on the right rendered as small text
  return (
    <div
      style={{
        marginLeft: "auto",
        display: "flex",
        gap: r(12),
        color: "rgba(245,245,247,0.55)",
        fontFamily: "Segoe UI, sans-serif",
        fontSize: r(14),
      }}
    >
      <span>—</span>
      <span>▢</span>
      <span>✕</span>
    </div>
  );
}

function Dot({ color, r }: { color: string; r: (px: number) => number }) {
  return (
    <span
      style={{
        width: r(13),
        height: r(13),
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
  color,
  cursorStyle,
  r,
}: {
  line: TerminalLine;
  prompt: string;
  startFrame: number;
  frame: number;
  framesPerChar: number;
  accent: string;
  gap: number;
  color: string;
  cursorStyle: TerminalCursorStyle;
  r: (px: number) => number;
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

  return (
    <div
      style={{
        marginBottom: gap,
        opacity: line.kind === "command" ? 1 : fadeIn,
        transform:
          line.kind === "command"
            ? "none"
            : `translate3d(0, ${snap((1 - fadeIn) * 4)}px, 0)`,
        display: "flex",
        gap: r(14),
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
        {showCursor && <Cursor kind={cursorStyle} />}
      </span>
    </div>
  );
}

function Cursor({ kind }: { kind: TerminalCursorStyle }) {
  const frame = useDesignFrame();
  const blink = Math.floor(frame / 16) % 2 === 0;
  const dims =
    kind === "underline"
      ? { width: "0.55em", height: "0.12em", translateY: "0.95em" }
      : kind === "bar"
        ? { width: "0.12em", height: "1.05em", translateY: "0.2em" }
        : { width: "0.55em", height: "1.05em", translateY: "0.2em" };
  return (
    <span
      style={{
        display: "inline-block",
        width: dims.width,
        height: dims.height,
        background: "currentColor",
        marginLeft: 2,
        transform: `translateY(${dims.translateY})`,
        opacity: blink ? 1 : 0,
      }}
    />
  );
}

function applyAlpha(color: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const c = color.trim().toLowerCase();
  if (c.startsWith("#") && c.length === 7) {
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  return color;
}
