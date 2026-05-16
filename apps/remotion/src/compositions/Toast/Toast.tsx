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

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type ToastVariant = "info" | "success" | "warning" | "error";

export type ToastProps = {
  title: string;
  description: string;
  position: ToastPosition;
  variant: ToastVariant;
  showIcon: boolean;
  durationVisibleSec: number;
  clipStyle?: ClipStyle;
};

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

const VARIANT_ACCENT: Record<ToastVariant, string> = {
  info: "#00bbff",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
};

export const Toast: React.FC<ToastProps> = ({
  title,
  description,
  position,
  variant,
  showIcon,
  durationVisibleSec,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const s = resolveClipStyle(clipStyle, {
    background: "#0f1014",
    color: "#ffffff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: VARIANT_ACCENT[variant],
  });

  const enterStart = 8;
  const visibleFrames = Math.round(durationVisibleSec * fps);
  const exitStart = Math.min(durationInFrames - 18, enterStart + visibleFrames);

  const enter = spring({
    frame: frame - enterStart,
    fps,
    config: { damping: 16, stiffness: 130, mass: 0.7 },
  });
  const exit = interpolate(frame, [exitStart, exitStart + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: APPLE_EASE,
  });
  const presence = Math.max(0, enter - exit);

  const isTop = position.startsWith("top-");
  const align = position.endsWith("left")
    ? "flex-start"
    : position.endsWith("right")
      ? "flex-end"
      : "center";
  const offset = (1 - presence) * (isTop ? -32 : 32);

  const bgIsDark = isHexDark(s.background);
  const muted = bgIsDark ? "rgba(255,255,255,0.65)" : "rgba(15,16,20,0.62)";
  const border = bgIsDark ? "rgba(255,255,255,0.10)" : "rgba(15,16,20,0.08)";

  return (
    <AbsoluteFill
      style={{
        background: "#ffffff",
        padding: 64,
        fontFamily: s.fontFamily,
        display: "flex",
        flexDirection: "column",
        justifyContent: isTop ? "flex-start" : "flex-end",
        alignItems: align,
      }}
    >
      <div
        style={{
          opacity: presence,
          transform: `translate3d(0, ${snap(offset * 2)}px, 0) scale(${0.96 + presence * 0.04})`,
          minWidth: 760,
          maxWidth: 920,
          background: s.background,
          color: s.color,
          borderRadius: 24,
          padding: "32px 38px",
          display: "flex",
          gap: 24,
          alignItems: "flex-start",
          boxShadow:
            "0 36px 96px rgba(0,0,0,0.45), 0 2px 0 rgba(255,255,255,0.06) inset",
          border: `2px solid ${border}`,
        }}
      >
        {showIcon !== false && (
          <ToastIcon variant={variant} accent={s.accent} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: "-0.018em",
              marginBottom: description ? 8 : 0,
              lineHeight: 1.15,
            }}
          >
            {title}
          </div>
          {description && (
            <div style={{ fontSize: 26, color: muted, lineHeight: 1.4 }}>
              {description}
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: 26,
            color: muted,
            cursor: "pointer",
            padding: 8,
            margin: -8,
            lineHeight: 1,
          }}
        >
          ✕
        </div>
      </div>
    </AbsoluteFill>
  );
};

function ToastIcon({
  variant,
  accent,
}: {
  variant: ToastVariant;
  accent: string;
}) {
  const path: Record<ToastVariant, string> = {
    success: "M5 13l4 4L19 7",
    info: "M12 8v4m0 4h.01",
    warning:
      "M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z",
    error: "M6 6l12 12M6 18 18 6",
  };
  const wrap: Record<ToastVariant, string> = {
    success: "rgba(16,185,129,0.16)",
    info: `${accent}28`,
    warning: "rgba(245,158,11,0.18)",
    error: "rgba(239,68,68,0.18)",
  };
  const stroke: Record<ToastVariant, string> = {
    success: "#10b981",
    info: accent,
    warning: "#f59e0b",
    error: "#ef4444",
  };
  return (
    <div
      style={{
        flexShrink: 0,
        width: 64,
        height: 64,
        borderRadius: 999,
        background: wrap[variant],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <path
          d={path[variant]}
          stroke={stroke[variant]}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function isHexDark(color: string): boolean {
  const c = color.trim().toLowerCase();
  if (c.startsWith("#") && c.length === 7) {
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.6;
  }
  return c !== "#fff" && c !== "white";
}
