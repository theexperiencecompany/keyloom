"use client";
import {
  AbsoluteFill,
  Img,
  spring,
  staticFile,
  useVideoConfig,
} from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { proxyExternalImg } from "../../proxy-image";
import { snap } from "../../snap";
import { useDesignFrame } from "../../use-design-frame";
import { ICON_PRESETS, resolveIconPreset } from "./icon-presets";

const DEFAULT_ICON_SRC = staticFile("message_icon.png");

/**
 * Resolve an icon path to a renderable URL:
 *   - data: / blob: URIs pass through unchanged
 *   - absolute http(s) URLs route through `/api/img/<encoded>` so the
 *     export canvas stays untainted
 *   - relative paths get `staticFile()`'d so the Remotion bundle server
 *     serves them in both studio and `remotion render`
 */
function resolveAsset(src: string | undefined): string | undefined {
  // Return undefined (not the empty string) so the `??` fallback chain in
  // the caller actually falls through when an upstream field is unset.
  if (!src) return undefined;
  if (/^(data:|blob:)/i.test(src)) return src;
  if (/^https?:/i.test(src)) return proxyExternalImg(src);
  return staticFile(src.replace(/^\//, ""));
}

export type MessagePopupProps = {
  sender: string;
  time: string;
  body: string;
  theme: "light" | "dark";
  /** Key into the macOS icon preset map (e.g. "whatsapp", "slack"). */
  iconPreset?: string;
  /** Custom uploaded/pasted icon — takes precedence over `iconPreset`. */
  iconCustom?: string;
  /** Universal Style — background, text color, font. */
  clipStyle?: ClipStyle;
};

export { ICON_PRESETS };

type Palette = {
  bg: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  text: string;
  timeText: string;
};

function getPalette(theme: "light" | "dark"): Palette {
  if (theme === "dark") {
    return {
      bg: "#000000",
      cardBg: "#1c1c1e",
      cardBorder: "rgba(255,255,255,0.06)",
      cardShadow: "0 30px 80px rgba(0,0,0,0.6), 0 4px 10px rgba(0,0,0,0.4)",
      text: "#ffffff",
      timeText: "rgba(255,255,255,0.45)",
    };
  }
  return {
    bg: "#ffffff",
    cardBg: "#ffffff",
    cardBorder: "rgba(15,16,20,0.05)",
    cardShadow:
      "0 30px 80px rgba(15,16,20,0.10), 0 4px 10px rgba(15,16,20,0.05)",
    text: "#0f1014",
    timeText: "rgba(15,16,20,0.45)",
  };
}

const D_CARD = 0;
const D_SENDER = 14;
const D_TIME = 20;
const D_BODY_START = 30;
const WORD_STAGGER = 4;

const NOTIF_WIDTH = 1080;
const NOTIF_PADDING = 28;
const ICON_SIZE = 96;

export const MessagePopup: React.FC<MessagePopupProps> = ({
  sender,
  time,
  body,
  theme,
  iconPreset,
  iconCustom,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();
  const basePalette = getPalette(theme);
  const s = resolveClipStyle(clipStyle, {
    background: basePalette.bg,
    color: basePalette.text,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: basePalette.text,
  });
  // Apply the universal Style on top of the theme palette: the screen
  // background, the notification's primary text, and a tint for the sender
  // name (the one obvious accent). Other chrome (time, card material) keeps
  // its authentic per-theme value.
  const palette: Palette = {
    ...basePalette,
    bg: s.background,
    text: s.color,
  };

  // Render priority: explicit custom upload > preset key > default icon.
  const iconSrc =
    resolveAsset(iconCustom) ??
    resolveAsset(resolveIconPreset(iconPreset)) ??
    DEFAULT_ICON_SRC;

  return (
    <AbsoluteFill
      style={{
        background: palette.bg,
        fontFamily: s.fontFamily,
        color: palette.text,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <NotificationBanner
          frame={frame}
          fps={fps}
          sender={sender}
          time={time}
          body={body}
          iconSrc={iconSrc}
          palette={palette}
          accent={s.accent}
        />
      </div>
    </AbsoluteFill>
  );
};

function NotificationBanner({
  frame,
  fps,
  sender,
  time,
  body,
  iconSrc,
  palette,
  accent,
}: {
  frame: number;
  fps: number;
  sender: string;
  time: string;
  body: string;
  iconSrc: string;
  palette: Palette;
  accent: string;
}) {
  const bodyWords = body.split(" ");

  const cardPop = spring({
    frame: frame - D_CARD,
    fps,
    config: { damping: 13, stiffness: 130, mass: 0.85 },
  });
  const cardScale = 0.85 + cardPop * 0.15;
  const cardOpacity = cardPop;
  const cardY = (1 - cardPop) * 24;

  return (
    <div
      style={{
        width: NOTIF_WIDTH,
        borderRadius: 32,
        background: palette.cardBg,
        border: `1px solid ${palette.cardBorder}`,
        boxShadow: palette.cardShadow,
        padding: NOTIF_PADDING,
        display: "flex",
        gap: 22,
        alignItems: "center",
        opacity: cardOpacity,
        transform: `translate3d(0, ${snap(cardY)}px, 0) scale(${cardScale})`,
      }}
    >
      <Img
        src={iconSrc}
        alt={sender}
        width={ICON_SIZE}
        height={ICON_SIZE}
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          borderRadius: 22,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 6,
          }}
        >
          <PopText frame={frame} fps={fps} delay={D_SENDER}>
            <span
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: accent,
                letterSpacing: "-0.01em",
              }}
            >
              {sender}
            </span>
          </PopText>
          <PopText frame={frame} fps={fps} delay={D_TIME}>
            <span
              style={{
                fontSize: 24,
                color: palette.timeText,
                fontWeight: 500,
              }}
            >
              {time}
            </span>
          </PopText>
        </div>

        <div
          style={{
            fontSize: 30,
            color: palette.text,
            fontWeight: 400,
            lineHeight: 1.3,
            letterSpacing: "-0.005em",
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          {bodyWords.map((word, i) => (
            <PopText
              key={i}
              frame={frame}
              fps={fps}
              delay={D_BODY_START + i * WORD_STAGGER}
            >
              <span style={{ display: "inline-block", marginRight: "0.28em" }}>
                {word}
              </span>
            </PopText>
          ))}
        </div>
      </div>
    </div>
  );
}

function PopText({
  frame,
  fps,
  delay,
  children,
}: {
  frame: number;
  fps: number;
  delay: number;
  children: React.ReactNode;
}) {
  const pop = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 160, mass: 0.6 },
  });

  const opacity = pop;
  const translateY = (1 - pop) * 18;
  const scale = 0.7 + pop * 0.3;

  return (
    <span
      style={{
        display: "inline-block",
        opacity,
        transform: `translate3d(0, ${snap(translateY)}px, 0) scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </span>
  );
}
