"use client";
import { AbsoluteFill, spring, useVideoConfig } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { snap } from "../../snap";
import { useDesignFrame } from "../../use-design-frame";

export type FeatureCardProps = {
  icon: string;
  title: string;
  body: string;
  theme: "light" | "dark";
  clipStyle?: ClipStyle;
};

const D_CARD = 0;
const D_ICON = 6;
const D_TITLE = 14;
const D_BODY = 22;

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  body,
  theme,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();
  const isDark = theme === "dark";
  const s = resolveClipStyle(clipStyle, {
    background: "#f7f7f9",
    color: isDark ? "#ffffff" : "#0f1014",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#6366f1",
  });
  const accent = s.accent;
  const bg = s.background;
  const fontFamily = s.fontFamily;

  const cardBg = isDark ? "#15161A" : "#ffffff";
  const text = isDark ? "#ffffff" : "#0f1014";
  const muted = isDark ? "rgba(255,255,255,0.6)" : "rgba(15,16,20,0.6)";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,16,20,0.08)";

  const cardPop = spring({
    frame: frame - D_CARD,
    fps,
    config: { damping: 16, stiffness: 110, mass: 0.8 },
  });

  return (
    <AbsoluteFill
      style={{
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
      }}
    >
      <div
        style={{
          width: 720,
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 28,
          padding: "44px 44px 48px",
          boxShadow: isDark
            ? "0 30px 80px rgba(0,0,0,0.45)"
            : "0 30px 80px rgba(15,16,20,0.08)",
          opacity: cardPop,
          transform: `translate3d(0, ${snap((1 - cardPop) * 24)}px, 0) scale(${0.94 + cardPop * 0.06})`,
        }}
      >
        <RevealItem frame={frame - D_ICON} fps={fps}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: `${accent}1A`,
              border: `1px solid ${accent}33`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
              marginBottom: 28,
            }}
          >
            {icon}
          </div>
        </RevealItem>

        <RevealItem frame={frame - D_TITLE} fps={fps}>
          <h2
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: text,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              margin: 0,
              marginBottom: 14,
            }}
          >
            {title}
          </h2>
        </RevealItem>

        <RevealItem frame={frame - D_BODY} fps={fps}>
          <p
            style={{
              fontSize: 22,
              color: muted,
              fontWeight: 400,
              lineHeight: 1.45,
              letterSpacing: "-0.005em",
              margin: 0,
            }}
          >
            {body}
          </p>
        </RevealItem>
      </div>
    </AbsoluteFill>
  );
};

function RevealItem({
  frame,
  fps,
  children,
}: {
  frame: number;
  fps: number;
  children: React.ReactNode;
}) {
  const reveal = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 150, mass: 0.7 },
  });
  return (
    <div
      style={{
        opacity: reveal,
        transform: `translate3d(0, ${snap((1 - reveal) * 14)}px, 0)`,
      }}
    >
      {children}
    </div>
  );
}
