"use client";
import { AbsoluteFill, spring, useVideoConfig } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { snap } from "../../snap";
import { useDesignFrame } from "../../use-design-frame";

export type PricingCardProps = {
  tier: string;
  price: string;
  period: string;
  features: string;
  cta: string;
  highlighted: "yes" | "no";
  theme: "light" | "dark";
  clipStyle?: ClipStyle;
};

const D_CARD = 0;
const D_TIER = 8;
const D_PRICE = 14;
const D_FEATURES_START = 24;
const FEATURE_STAGGER = 5;
const D_CTA_AFTER_FEATURES = 8;

export const PricingCard: React.FC<PricingCardProps> = ({
  tier,
  price,
  period,
  features,
  cta,
  highlighted,
  theme,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();
  const isDark = theme === "dark";
  const isHighlighted = highlighted === "yes";
  const s = resolveClipStyle(clipStyle, {
    background: "#f7f7f9",
    color: isDark ? "#ffffff" : "#0f1014",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#00bbff",
  });
  const accent = s.accent;
  const bg = s.background;
  const fontFamily = s.fontFamily;

  const cardBg = isDark ? "#15161A" : "#ffffff";
  const text = isDark ? "#ffffff" : "#0f1014";
  const muted = isDark ? "rgba(255,255,255,0.55)" : "rgba(15,16,20,0.55)";
  const border = isHighlighted
    ? accent
    : isDark
      ? "rgba(255,255,255,0.1)"
      : "rgba(15,16,20,0.1)";

  const featureList = features
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);

  const cardPop = spring({
    frame: frame - D_CARD,
    fps,
    config: { damping: 16, stiffness: 110, mass: 0.8 },
  });

  const ctaDelay =
    D_FEATURES_START +
    featureList.length * FEATURE_STAGGER +
    D_CTA_AFTER_FEATURES;

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
          width: 560,
          background: cardBg,
          border: `${isHighlighted ? "2px" : "1px"} solid ${border}`,
          borderRadius: 28,
          padding: "44px 40px",
          position: "relative",
          boxShadow: isHighlighted
            ? `0 30px 80px ${accent}33, 0 0 0 6px ${accent}1A`
            : isDark
              ? "0 30px 80px rgba(0,0,0,0.45)"
              : "0 30px 80px rgba(15,16,20,0.08)",
          opacity: cardPop,
          transform: `translate3d(0, ${snap((1 - cardPop) * 24)}px, 0) scale(${0.95 + cardPop * 0.05})`,
        }}
      >
        {isHighlighted ? (
          <div
            style={{
              position: "absolute",
              top: -16,
              left: "50%",
              transform: "translateX(-50%)",
              background: accent,
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "6px 14px",
              borderRadius: 999,
            }}
          >
            Most popular
          </div>
        ) : null}

        <RevealItem frame={frame - D_TIER} fps={fps}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: isHighlighted ? accent : text,
              letterSpacing: "-0.005em",
              textTransform: "uppercase",
            }}
          >
            {tier}
          </div>
        </RevealItem>

        <RevealItem frame={frame - D_PRICE} fps={fps}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              marginTop: 10,
              marginBottom: 26,
            }}
          >
            <span
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: text,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {price}
            </span>
            {period ? (
              <span
                style={{
                  fontSize: 18,
                  color: muted,
                  fontWeight: 500,
                }}
              >
                {period}
              </span>
            ) : null}
          </div>
        </RevealItem>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            marginBottom: 28,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {featureList.map((f, i) => (
            <RevealItem
              key={i}
              frame={frame - (D_FEATURES_START + i * FEATURE_STAGGER)}
              fps={fps}
            >
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 18,
                  color: text,
                  lineHeight: 1.4,
                }}
              >
                <CheckMark color={accent} />
                <span>{f}</span>
              </li>
            </RevealItem>
          ))}
        </ul>

        <RevealItem frame={frame - ctaDelay} fps={fps}>
          <div
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 14,
              background: isHighlighted ? accent : "transparent",
              color: isHighlighted ? "#ffffff" : text,
              border: isHighlighted ? "none" : `1px solid ${border}`,
              fontSize: 18,
              fontWeight: 700,
              textAlign: "center",
              letterSpacing: "-0.005em",
            }}
          >
            {cta}
          </div>
        </RevealItem>
      </div>
    </AbsoluteFill>
  );
};

function CheckMark({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: `${color}22`,
        color,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M2 6.5l2.5 2.5L10 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
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
    config: { damping: 14, stiffness: 150, mass: 0.7 },
  });
  return (
    <div
      style={{
        opacity: reveal,
        transform: `translate3d(0, ${snap((1 - reveal) * 12)}px, 0)`,
      }}
    >
      {children}
    </div>
  );
}
