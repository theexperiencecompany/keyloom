"use client";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useVideoConfig,
} from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { componentsByIdBase } from "../../componentsBase";
import { proxyExternalImg } from "../../proxy-image";
import { compositionsById } from "../../registry";
import { snap } from "../../snap";
import { useDesignFrame } from "../../use-design-frame";

export type ShowcaseFrameStyle = "video" | "browser" | "minimal" | "floating";

export type ShowcaseBackdrop =
  | "solid"
  | "dotted"
  | "grid"
  | "gradient"
  | "image";

export type ShowcaseProps = {
  eyebrow: string;
  title: string;
  caption: string;
  childCompositionId: string;
  frameStyle: ShowcaseFrameStyle;
  backdrop: ShowcaseBackdrop;
  backdropImage: string;
  backdropColorA: string;
  backdropColorB: string;
  innerScale: number;
  cornerRadius: number;
  shadowIntensity: number;
  borderColor: string;
  clipStyle?: ClipStyle;
};

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const Showcase: React.FC<ShowcaseProps> = ({
  eyebrow,
  title,
  caption,
  childCompositionId,
  frameStyle,
  backdrop,
  backdropImage,
  backdropColorA,
  backdropColorB,
  innerScale,
  cornerRadius,
  shadowIntensity,
  borderColor,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { durationInFrames } = useVideoConfig();
  const s = resolveClipStyle(clipStyle, {
    background: "#ffffff",
    color: "#0f1014",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#00bbff",
  });

  const titleProgress = interpolate(frame, [4, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: APPLE_EASE,
  });
  const captionProgress = interpolate(frame, [12, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: APPLE_EASE,
  });
  const frameProgress = interpolate(frame, [16, 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: APPLE_EASE,
  });

  const Child = componentsByIdBase[childCompositionId];
  const childInfo = compositionsById[childCompositionId];
  const childProps = (childInfo?.defaultProps ?? {}) as Record<string, unknown>;
  const childRatio = childInfo
    ? `${childInfo.width} / ${childInfo.height}`
    : "16 / 9";

  const bgIsLight = isHexLight(s.background);
  const muted = bgIsLight ? "rgba(15,16,20,0.55)" : "rgba(255,255,255,0.65)";

  const playbackProgress = Math.min(
    1,
    frame / Math.max(1, durationInFrames - 1),
  );

  const showCaption = caption.trim().length > 0;
  const showHeader = title.trim().length > 0 || eyebrow.trim().length > 0;

  return (
    <AbsoluteFill
      style={{
        background: s.background,
        color: s.color,
        fontFamily: s.fontFamily,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <Backdrop
        kind={backdrop}
        image={backdropImage}
        colorA={backdropColorA}
        colorB={backdropColorB}
        accent={s.accent}
      />

      <AbsoluteFill
        style={{
          padding: 72,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {showHeader && (
          <div
            style={{
              textAlign: "center",
              maxWidth: 1200,
              marginBottom: 36,
              opacity: titleProgress,
              transform: `translate3d(0, ${snap((1 - titleProgress) * 14)}px, 0)`,
            }}
          >
            {eyebrow.trim() && (
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: s.accent,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                {eyebrow}
              </div>
            )}
            {title.trim() && (
              <div
                style={{
                  fontSize: 72,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                  color: s.color,
                }}
              >
                {title}
              </div>
            )}
            {showCaption && (
              <div
                style={{
                  marginTop: 14,
                  fontSize: 22,
                  fontWeight: 400,
                  color: muted,
                  opacity: captionProgress,
                }}
              >
                {caption}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            position: "relative",
            flex: 1,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: frameProgress,
            transform: `translate3d(0, ${snap((1 - frameProgress) * 24)}px, 0) scale(${0.96 + frameProgress * 0.04})`,
          }}
        >
          <FrameWrapper
            style={frameStyle}
            cornerRadius={cornerRadius}
            shadowIntensity={shadowIntensity}
            borderColor={borderColor}
            innerScale={innerScale}
            childRatio={childRatio}
            playbackProgress={playbackProgress}
            bgIsLight={bgIsLight}
            accent={s.accent}
          >
            {Child ? (
              <Child {...childProps} />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: muted,
                  fontSize: 18,
                }}
              >
                Pick a child composition in the Inspector
              </div>
            )}
          </FrameWrapper>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

function FrameWrapper({
  style,
  cornerRadius,
  shadowIntensity,
  borderColor,
  innerScale,
  childRatio,
  playbackProgress,
  bgIsLight,
  accent,
  children,
}: {
  style: ShowcaseFrameStyle;
  cornerRadius: number;
  shadowIntensity: number;
  borderColor: string;
  innerScale: number;
  childRatio: string;
  playbackProgress: number;
  bgIsLight: boolean;
  accent: string;
  children: React.ReactNode;
}) {
  const shadow =
    shadowIntensity <= 0
      ? "none"
      : `0 ${20 + shadowIntensity * 60}px ${40 + shadowIntensity * 120}px rgba(0,0,0,${(bgIsLight ? 0.12 : 0.55) * Math.min(1, shadowIntensity)})`;

  const radius =
    style === "video" || style === "browser" ? cornerRadius : cornerRadius;

  // Browser style: top chrome bar with traffic lights; video style: bottom
  // progress bar overlay; minimal: nothing; floating: no chrome, big shadow,
  // pinned in a pill.
  const showChrome = style === "browser";
  const showPlayer = style === "video";

  return (
    <div
      style={{
        width: `${innerScale * 100}%`,
        aspectRatio: childRatio,
        borderRadius: radius,
        overflow: "hidden",
        boxShadow: shadow,
        border:
          style === "minimal" || style === "floating"
            ? "none"
            : `1px solid ${borderColor}`,
        background: "#000",
        position: "relative",
      }}
    >
      {showChrome && (
        <div
          style={{
            height: 36,
            background: bgIsLight ? "#f1f3f5" : "#1c1c22",
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            borderBottom: `1px solid ${borderColor}`,
            gap: 8,
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#ff5f57",
            }}
          />
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#febc2e",
            }}
          />
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#28c840",
            }}
          />
        </div>
      )}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: showChrome ? "calc(100% - 36px)" : "100%",
        }}
      >
        {children}
        {showPlayer && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 18px",
              background:
                "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 100%)",
              color: "#ffffff",
              fontSize: 13,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <div
              style={{
                flex: 1,
                height: 4,
                background: "rgba(255,255,255,0.25)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${playbackProgress * 100}%`,
                  height: "100%",
                  background: accent,
                  borderRadius: 2,
                }}
              />
            </div>
            <span style={{ minWidth: 42, textAlign: "right" }}>
              {(playbackProgress * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Backdrop({
  kind,
  image,
  colorA,
  colorB,
  accent,
}: {
  kind: ShowcaseBackdrop;
  image: string;
  colorA: string;
  colorB: string;
  accent: string;
}) {
  if (kind === "solid") return null;
  if (kind === "image" && image) {
    return (
      <AbsoluteFill>
        <Img
          src={proxyExternalImg(image)}
          crossOrigin="anonymous"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "saturate(1.05)",
          }}
        />
        <AbsoluteFill style={{ background: "rgba(0,0,0,0.25)" }} aria-hidden />
      </AbsoluteFill>
    );
  }
  if (kind === "gradient") {
    return (
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${colorA} 0%, ${colorB} 100%)`,
        }}
      />
    );
  }
  if (kind === "dotted") {
    return (
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${accent}33 1px, transparent 1.5px)`,
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse at center, black 35%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 35%, transparent 75%)",
        }}
      />
    );
  }
  // grid
  return (
    <AbsoluteFill
      style={{
        backgroundImage:
          "linear-gradient(rgba(15,16,20,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,16,20,0.06) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        maskImage:
          "radial-gradient(ellipse at center, black 35%, transparent 75%)",
        WebkitMaskImage:
          "radial-gradient(ellipse at center, black 35%, transparent 75%)",
      }}
    />
  );
}

function isHexLight(color: string): boolean {
  const c = color.trim().toLowerCase();
  if (c === "white" || c === "#fff" || c === "#ffffff") return true;
  if (c.startsWith("#") && c.length === 7) {
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
  }
  return false;
}
