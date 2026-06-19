"use client";
import {
  AbsoluteFill,
  Img,
  spring,
  staticFile,
  useVideoConfig,
} from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { FitContent } from "../../fit-content";
import { proxyExternalImg } from "../../proxy-image";
import { snap } from "../../snap";
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

  return (
    <FitContent
      designWidth={1920}
      designHeight={1080}
      background={s.background}
    >
      <AbsoluteFill
        style={{
          color: s.color,
          fontFamily: s.fontFamily,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 28,
            opacity: enter,
            transform: `translate3d(0, ${snap((1 - enter) * 24)}px, 0) scale(${0.92 + enter * 0.08})`,
          }}
        >
          {resolved ? (
            <Img
              src={resolved}
              crossOrigin="anonymous"
              style={{
                maxWidth: 760,
                maxHeight: 760,
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
                fontSize: 30,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                textAlign: "center",
                color: s.color,
                maxWidth: 1000,
              }}
            >
              {trimmedCaption}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    </FitContent>
  );
};
