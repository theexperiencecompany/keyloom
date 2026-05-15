import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useVideoConfig,
} from "remotion";
import { useDesignFrame } from "../use-design-frame";

export const BROWSER_SCROLL_DURATION = 360; // 6s @ 60fps
export const BROWSER_SCROLL_FPS = 60;
export const BROWSER_SCROLL_WIDTH = 1280;
export const BROWSER_SCROLL_HEIGHT = 720;

// ===== PROPS =====
export type BrowserScrollProps = {
  imageFile: string;
  pageHeight: number; // fallback if measurement hasn't completed yet
};

// ===== Scroll timing =====
const SCROLL_HOLD_BEFORE = 18;
const SCROLL_HOLD_AFTER = 18;

export const BrowserScroll: React.FC<BrowserScrollProps> = ({
  imageFile,
  pageHeight,
}) => {
  const frame = useDesignFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const screenshotSrc = staticFile(imageFile);

  // Measure image natural dimensions once it loads — no delayRender
  // (avoids hook-count mismatches across renders / hot reloads).
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const scaled = (img.naturalHeight * width) / img.naturalWidth;
      setMeasuredHeight(scaled);
    };
    img.src = screenshotSrc;
  }, [screenshotSrc, width]);

  const effectiveHeight =
    measuredHeight ??
    (Number.isFinite(pageHeight) && pageHeight > 0 ? pageHeight : 2400);

  const maxScroll = Math.max(0, effectiveHeight - height);
  const scrollStart = SCROLL_HOLD_BEFORE;
  const scrollEnd = durationInFrames - SCROLL_HOLD_AFTER;

  const scrollY = interpolate(frame, [scrollStart, scrollEnd], [0, maxScroll], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  return (
    <AbsoluteFill style={{ background: "#ffffff", overflow: "hidden" }}>
      <Img
        src={screenshotSrc}
        alt="page"
        style={{
          position: "absolute",
          top: -scrollY,
          left: 0,
          width: "100%",
          display: "block",
        }}
      />
    </AbsoluteFill>
  );
};
