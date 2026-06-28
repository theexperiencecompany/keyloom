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
import { useCanvasLayout } from "../../use-canvas-layout";
import { useDesignFrame } from "../../use-design-frame";

export type ImageSceneProps = {
  src: string;
  caption: string;
  clipStyle?: ClipStyle;
};

/**
 * Resolve an image src to a renderable URL:
 *   - empty → undefined (lets the component render a placeholder)
 *   - data:/blob: → pass through
 *   - http(s) → route through `/api/img/<encoded>` so the export canvas
 *     stays untainted
 *   - bare paths → `staticFile()` so the Remotion bundle server serves
 *     them in both studio + CLI render
 */
function resolveAsset(src: string | undefined): string | undefined {
  if (!src) return undefined;
  if (/^(data:|blob:)/i.test(src)) return src;
  if (/^https?:/i.test(src)) return proxyExternalImg(src);
  return staticFile(src.replace(/^\//, ""));
}

export const ImageScene: React.FC<ImageSceneProps> = ({
  src,
  caption,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();
  const { vw, vh, vmin } = useCanvasLayout();
  const s = resolveClipStyle(clipStyle, {
    background: "#ffffff",
    color: "#0f1014",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#0a84ff",
  });

  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 110, mass: 0.85 },
  });

  const resolved = resolveAsset(src);
  const trimmedCaption = caption.trim();

  // Cap the image so it fills the canvas without overflowing in any aspect
  // ratio; the caption sits below it in a centered flex column.
  const imgMax = Math.min(vw(70), vh(70));

  return (
    <AbsoluteFill
      style={{
        background: s.background,
        color: s.color,
        fontFamily: s.fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: vmin(7.4),
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: vmin(2.6),
          opacity: enter,
          transform: `translate3d(0, ${snap((1 - enter) * vmin(2.2))}px, 0) scale(${0.92 + enter * 0.08})`,
        }}
      >
        {resolved ? (
          <Img
            src={resolved}
            crossOrigin="anonymous"
            style={{
              maxWidth: imgMax,
              maxHeight: imgMax,
              width: "auto",
              height: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        ) : null}
        {trimmedCaption ? (
          <div
            style={{
              fontSize: vmin(2.8),
              fontWeight: 500,
              letterSpacing: "-0.01em",
              textAlign: "center",
              color: s.color,
              maxWidth: vw(85),
            }}
          >
            {trimmedCaption}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
