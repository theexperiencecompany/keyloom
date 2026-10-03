"use client";
import { AbsoluteFill, Img, spring, useVideoConfig } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { tint } from "../../lib/color";
import { proxyExternalImg } from "../../proxy-image";
import { snap } from "../../snap";
import { useCanvasLayout } from "../../use-canvas-layout";
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
const D_LOGOS_START = 8;
const STAGGER = 4;

export const LogoCloud: React.FC<LogoCloudProps> = ({
  headline,
  logos,
  theme,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();
  const { vw, vmin, isPortrait } = useCanvasLayout();
  const isDark = theme === "dark";
  const s = resolveClipStyle(clipStyle, {
    background: isDark ? "#0f1014" : "#f7f7f9",
    color: isDark ? "#ffffff" : "#0f1014",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#6366f1",
  });

  const headlineIn = spring({
    frame: frame - D_HEADLINE,
    fps,
    config: { damping: 16, stiffness: 140, mass: 0.7 },
  });

  const maxCols = isPortrait ? 2 : logos.length > 5 ? 3 : 5;
  const cols = Math.max(1, Math.min(logos.length, maxCols));

  return (
    <AbsoluteFill
      style={{
        background: s.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: `${vmin(8)}px ${vw(8)}px`,
        fontFamily: s.fontFamily,
      }}
    >
      <div
        style={{
          fontSize: vmin(2.6),
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontWeight: 600,
          color: tint(s.color, 50),
          marginBottom: vmin(9),
          opacity: headlineIn,
          transform: `translate3d(0, ${snap((1 - headlineIn) * vmin(1.8))}px, 0)`,
        }}
      >
        {headline}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          columnGap: vw(4),
          rowGap: vmin(7),
          alignItems: "center",
          justifyItems: "center",
          width: "100%",
          maxWidth: vw(84),
        }}
      >
        {logos.map((logo, i) => (
          <LogoItemView
            key={i}
            logo={logo}
            frame={frame - (D_LOGOS_START + i * STAGGER)}
            fps={fps}
            color={s.color}
            isDark={isDark}
            boxHeight={vmin(9)}
            maxW={Math.min(vw(13), vmin(26))}
            fontSize={vmin(4)}
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
  isDark,
  boxHeight,
  maxW,
  fontSize,
}: {
  logo: LogoItem;
  frame: number;
  fps: number;
  color: string;
  isDark: boolean;
  boxHeight: number;
  maxW: number;
  fontSize: number;
}) {
  const reveal = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 150, mass: 0.7 },
  });
  const rise = `translate3d(0, ${snap((1 - reveal) * 14)}px, 0)`;

  if (logo.url) {
    return (
      <div
        style={{
          height: boxHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: reveal * 0.55,
          transform: rise,
        }}
      >
        <Img
          src={proxyExternalImg(logo.url)}
          crossOrigin="anonymous"
          alt={logo.name}
          style={{
            maxHeight: "100%",
            maxWidth: maxW,
            objectFit: "contain",
            filter: isDark ? "grayscale(100%) invert(1)" : "grayscale(100%)",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        height: boxHeight,
        display: "flex",
        alignItems: "center",
        fontSize,
        fontWeight: 600,
        color: tint(color, 55),
        letterSpacing: "-0.01em",
        opacity: reveal,
        transform: rise,
      }}
    >
      {logo.name}
    </div>
  );
}
