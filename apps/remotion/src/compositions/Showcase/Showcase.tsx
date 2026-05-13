"use client";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { componentsByIdBase } from "../../componentsBase";
import { compositionsById } from "../../registry";

export type ShowcaseProps = {
  eyebrow: string;
  title: string;
  caption: string;
  childCompositionId: string;
  backdrop: "gradient" | "radial" | "grid" | "solid";
  cornerRadius: number;
  innerScale: number;
  clipStyle?: ClipStyle;
};

const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const Showcase: React.FC<ShowcaseProps> = ({
  eyebrow,
  title,
  caption,
  childCompositionId,
  backdrop,
  cornerRadius,
  innerScale,
  clipStyle,
}) => {
  const frame = useCurrentFrame();
  const s = resolveClipStyle(clipStyle, {
    background: "#0b0b0f",
    color: "#ffffff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#6366f1",
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
      <Backdrop kind={backdrop} accent={s.accent} />

      <AbsoluteFill
        style={{
          padding: 64,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            textAlign: "center",
            maxWidth: 1200,
            marginBottom: 36,
            opacity: titleProgress,
            transform: `translateY(${(1 - titleProgress) * 14}px)`,
          }}
        >
          {eyebrow && (
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
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            {title}
          </div>
          {caption && (
            <div
              style={{
                marginTop: 14,
                fontSize: 22,
                fontWeight: 400,
                color: "rgba(255,255,255,0.65)",
                opacity: captionProgress,
              }}
            >
              {caption}
            </div>
          )}
        </div>

        <div
          style={{
            position: "relative",
            flex: 1,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: frameProgress,
            transform: `translateY(${(1 - frameProgress) * 24}px) scale(${0.96 + frameProgress * 0.04})`,
          }}
        >
          <div
            style={{
              width: `${innerScale * 100}%`,
              aspectRatio: "16 / 9",
              borderRadius: cornerRadius,
              overflow: "hidden",
              boxShadow:
                "0 40px 100px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.08) inset",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#000",
              position: "relative",
            }}
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
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 18,
                }}
              >
                Pick a child composition in the Inspector
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

function Backdrop({
  kind,
  accent,
}: {
  kind: ShowcaseProps["backdrop"];
  accent: string;
}) {
  if (kind === "solid") return null;
  if (kind === "gradient") {
    return (
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${accent}28 0%, transparent 60%), radial-gradient(circle at 80% 20%, ${accent}1a 0%, transparent 50%)`,
        }}
      />
    );
  }
  if (kind === "radial") {
    return (
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, ${accent}22 0%, transparent 65%)`,
        }}
      />
    );
  }
  // grid
  return (
    <AbsoluteFill
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        maskImage:
          "radial-gradient(ellipse at center, black 35%, transparent 75%)",
        WebkitMaskImage:
          "radial-gradient(ellipse at center, black 35%, transparent 75%)",
      }}
    />
  );
}
