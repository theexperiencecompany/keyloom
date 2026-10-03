"use client";
import { AbsoluteFill, Img, spring, useVideoConfig } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { tint } from "../../lib/color";
import { proxyExternalImg } from "../../proxy-image";
import { snap } from "../../snap";
import { useCanvasLayout } from "../../use-canvas-layout";
import { useDesignFrame } from "../../use-design-frame";

export type TestimonialCardProps = {
  quote: string;
  avatarUrl: string;
  name: string;
  role: string;
  company: string;
  theme: "light" | "dark";
  clipStyle?: ClipStyle;
};

const D_STARS = 0;
const D_QUOTE = 5;
const D_AUTHOR = 16;

export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  quote,
  avatarUrl,
  name,
  role,
  company,
  theme,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();
  const { vw, vmin } = useCanvasLayout();
  const r = (px: number) => vmin((px / 720) * 100);
  const isDark = theme === "dark";
  const s = resolveClipStyle(clipStyle, {
    background: isDark ? "#0f1014" : "#f7f7f9",
    color: isDark ? "#ffffff" : "#0f1014",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#6366f1",
  });
  const muted = tint(s.color, 55);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AbsoluteFill
      style={{
        background: s.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: s.fontFamily,
        padding: "8%",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: Math.max(vw(65), r(720)),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <RevealItem frame={frame - D_STARS} fps={fps}>
          <div style={{ display: "flex", gap: r(8), marginBottom: r(30) }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={r(20)} color={s.accent} />
            ))}
          </div>
        </RevealItem>

        <RevealItem frame={frame - D_QUOTE} fps={fps}>
          <p
            style={{
              fontSize: r(42),
              fontWeight: 500,
              lineHeight: 1.35,
              letterSpacing: "-0.015em",
              color: s.color,
              margin: 0,
              maxWidth: r(900),
            }}
          >
            <span
              style={{
                color: s.accent,
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "1.4em",
                lineHeight: 0,
                verticalAlign: "-0.08em",
                marginRight: "0.06em",
              }}
            >
              &ldquo;
            </span>
            {quote}
          </p>
        </RevealItem>

        <RevealItem frame={frame - D_AUTHOR} fps={fps}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: r(16),
              marginTop: r(44),
            }}
          >
            {avatarUrl ? (
              <Img
                src={proxyExternalImg(avatarUrl)}
                crossOrigin="anonymous"
                alt={name}
                style={{
                  width: r(56),
                  height: r(56),
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: r(56),
                  height: r(56),
                  borderRadius: "50%",
                  background: tint(s.accent, 15),
                  color: s.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: r(20),
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
            )}
            <div style={{ textAlign: "left" }}>
              <div
                style={{
                  fontSize: r(21),
                  fontWeight: 600,
                  color: s.color,
                  letterSpacing: "-0.005em",
                }}
              >
                {name}
              </div>
              <div style={{ fontSize: r(17), color: muted, marginTop: r(3) }}>
                {role}
                {company ? ` · ${company}` : ""}
              </div>
            </div>
          </div>
        </RevealItem>
      </div>
    </AbsoluteFill>
  );
};

function Star({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <path d="M8 .5l2.2 4.55 5 .73-3.6 3.52.85 5-4.45-2.35L3.55 14.3l.85-5L.8 5.78l5-.73z" />
    </svg>
  );
}

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
    config: { damping: 16, stiffness: 150, mass: 0.7 },
  });
  return (
    <div
      style={{
        opacity: reveal,
        transform: `translate3d(0, ${snap((1 - reveal) * 16)}px, 0)`,
      }}
    >
      {children}
    </div>
  );
}
