"use client";
import { AbsoluteFill, Img, interpolate } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { asset } from "../../lib/asset";
import { APPLE_EASE } from "../../lib/easing";
import { snap } from "../../snap";
import { useCanvasLayout } from "../../use-canvas-layout";
import { useDesignFrame } from "../../use-design-frame";

export type ImageSceneProps = {
  src: string;
  caption: string;
  clipStyle?: ClipStyle;
};

export const ImageScene: React.FC<ImageSceneProps> = ({
  src,
  caption,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { vmin } = useCanvasLayout();
  const s = resolveClipStyle(clipStyle, {
    background: "#0f1014",
    color: "#ffffff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#0a84ff",
  });

  const zoom = interpolate(frame, [0, 170], [1.04, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: APPLE_EASE,
  });
  const captionReveal = interpolate(frame, [8, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: APPLE_EASE,
  });

  const resolved = asset(src);
  const trimmedCaption = caption.trim();

  return (
    <AbsoluteFill
      style={{
        background: s.background,
        color: s.color,
        fontFamily: s.fontFamily,
        overflow: "hidden",
      }}
    >
      {resolved ? (
        <Img
          src={resolved}
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${zoom})`,
            transformOrigin: "50% 50%",
          }}
        />
      ) : null}
      {trimmedCaption ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "30%",
              background:
                "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: vmin(7),
              right: vmin(7),
              bottom: vmin(6),
              textAlign: "center",
              fontSize: vmin(3.2),
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: s.color,
              textShadow: "0 1px 14px rgba(0,0,0,0.35)",
              opacity: captionReveal,
              transform: `translate3d(0, ${snap((1 - captionReveal) * vmin(1.2))}px, 0)`,
            }}
          >
            {trimmedCaption}
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
