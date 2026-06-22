"use client";
import { AbsoluteFill, Img, spring, useVideoConfig } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
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

const D_CARD = 0;
const D_QUOTE_MARK = 4;
const D_QUOTE = 12;
const D_AVATAR = 24;

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
  const { vw, vh, vmin } = useCanvasLayout();
  // Design canvas was 1280×720 (min side 720). Convert authored px → relative
  // so the card reflows to any aspect instead of uniformly shrinking.
  const r = (px: number) => vmin((px / 720) * 100);
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
  const muted = isDark ? "rgba(255,255,255,0.55)" : "rgba(15,16,20,0.55)";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,16,20,0.08)";

  const cardPop = spring({
    frame: frame - D_CARD,
    fps,
    config: { damping: 16, stiffness: 110, mass: 0.8 },
  });

  const markPop = spring({
    frame: frame - D_QUOTE_MARK,
    fps,
    config: { damping: 12, stiffness: 160, mass: 0.6 },
  });

  // The card was a fixed 880px box centered on the 1280-wide design. Size it
  // relative to the canvas and cap it, so it fits portrait and landscape.
  const cardWidth = Math.min(vw(88), vh(110), r(880));
  const padX = r(56);

  return (
    <AbsoluteFill
      style={{
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
        padding: vmin(5),
      }}
    >
      <div
        style={{
          width: cardWidth,
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: r(32),
          padding: `${r(56)}px ${padX}px ${r(48)}px`,
          position: "relative",
          boxShadow: isDark
            ? "0 30px 80px rgba(0,0,0,0.45)"
            : "0 30px 80px rgba(15,16,20,0.08)",
          opacity: cardPop,
          transform: `translate3d(0, ${snap((1 - cardPop) * 24)}px, 0) scale(${0.95 + cardPop * 0.05})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: r(14),
            left: r(36),
            fontSize: r(180),
            lineHeight: 1,
            color: accent,
            fontFamily: "Georgia, serif",
            fontWeight: 800,
            opacity: markPop * 0.18,
            transform: `scale(${0.4 + markPop * 0.6})`,
            transformOrigin: "top left",
          }}
        >
          “
        </div>

        <RevealItem frame={frame - D_QUOTE} fps={fps}>
          <p
            style={{
              fontSize: r(30),
              color: text,
              fontWeight: 500,
              lineHeight: 1.4,
              letterSpacing: "-0.01em",
              margin: 0,
              marginTop: r(24),
              position: "relative",
              zIndex: 1,
            }}
          >
            {quote}
          </p>
        </RevealItem>

        <RevealItem frame={frame - D_AVATAR} fps={fps}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: r(16),
              marginTop: r(36),
            }}
          >
            <Img
              src={proxyExternalImg(avatarUrl)}
              crossOrigin="anonymous"
              alt={name}
              style={{
                width: r(68),
                height: r(68),
                borderRadius: "50%",
                objectFit: "cover",
                border: `2px solid ${border}`,
                flexShrink: 0,
              }}
            />
            <div>
              <div
                style={{
                  fontSize: r(22),
                  fontWeight: 700,
                  color: text,
                  letterSpacing: "-0.005em",
                }}
              >
                {name}
              </div>
              <div
                style={{
                  fontSize: r(18),
                  color: muted,
                  fontWeight: 400,
                  marginTop: r(2),
                }}
              >
                {role}
                {company ? (
                  <span style={{ color: accent }}> · {company}</span>
                ) : null}
              </div>
            </div>
          </div>
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
