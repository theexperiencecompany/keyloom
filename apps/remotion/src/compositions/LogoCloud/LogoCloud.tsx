"use client";
import { AbsoluteFill, Img, spring, useVideoConfig } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { proxyExternalImg } from "../../proxy-image";
import { snap } from "../../snap";
import { useDesignFrame } from "../../use-design-frame";

export type LogoItem = {
  name: string;
  url: string;
};

export type LogoCloudProps = {
  headline: string;
  logos: LogoItem[];
  theme: "light" | "dark";
  clipStyle?: ClipStyle;
};

const D_HEADLINE = 0;
const D_LOGOS_START = 12;
const STAGGER = 4;

export const LogoCloud: React.FC<LogoCloudProps> = ({
  headline,
  logos,
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
  const bg = s.background;
  const fontFamily = s.fontFamily;

  const text = isDark ? "#ffffff" : "#0f1014";
  const muted = isDark ? "rgba(255,255,255,0.55)" : "rgba(15,16,20,0.55)";

  const headlinePop = spring({
    frame: frame - D_HEADLINE,
    fps,
    config: { damping: 16, stiffness: 130, mass: 0.7 },
  });

  return (
    <AbsoluteFill
      style={{
        background: bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
        fontFamily,
      }}
    >
      <div
        style={{
          fontSize: 22,
          letterSpacing: "0.18em",
          color: muted,
          fontWeight: 600,
          textTransform: "uppercase",
          marginBottom: 56,
          opacity: headlinePop,
          transform: `translate3d(0, ${snap((1 - headlinePop) * 12)}px, 0)`,
        }}
      >
        {headline}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(logos.length, 5)}, minmax(0, 1fr))`,
          gap: 56,
          alignItems: "center",
          justifyItems: "center",
          width: "100%",
          maxWidth: 1100,
        }}
      >
        {logos.map((logo, i) => (
          <LogoItemView
            key={i}
            logo={logo}
            frame={frame - (D_LOGOS_START + i * STAGGER)}
            fps={fps}
            color={text}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

function LogoItemView({
  logo,
  frame,
  fps,
  color,
}: {
  logo: LogoItem;
  frame: number;
  fps: number;
  color: string;
}) {
  const reveal = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 150, mass: 0.7 },
  });

  if (logo.url) {
    return (
      <Img
        src={proxyExternalImg(logo.url)}
        crossOrigin="anonymous"
        alt={logo.name}
        style={{
          maxWidth: 180,
          maxHeight: 60,
          objectFit: "contain",
          opacity: reveal * 0.85,
          transform: `translate3d(0, ${snap((1 - reveal) * 14)}px, 0) scale(${0.94 + reveal * 0.06})`,
          filter: "grayscale(40%)",
        }}
      />
    );
  }

  return (
    <div
      style={{
        fontSize: 28,
        fontWeight: 700,
        color,
        letterSpacing: "-0.01em",
        opacity: reveal * 0.85,
        transform: `translate3d(0, ${snap((1 - reveal) * 14)}px, 0)`,
      }}
    >
      {logo.name}
    </div>
  );
}
