"use client";
import { AbsoluteFill, Img, spring, useVideoConfig } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { componentsByIdBase as componentsById } from "../../componentsBase";
import { proxyExternalImg } from "../../proxy-image";
import { compositionsById } from "../../registry";
import { SafeAreaContext } from "../../safe-area";
import type { PhoneFitMode } from "../../schema";
import { snap } from "../../snap";
import { useDesignFrame } from "../../use-design-frame";

export type PhoneFrameProps = {
  device: "dynamic-island" | "notch" | "plain";
  innerCompositionId: string;
  screenImage: string;
  innerProps?: Record<string, unknown>;
  clipStyle?: ClipStyle;
};

const PHONE_W = 760;
const PHONE_H = 1560;
const BEZEL = 18;
const SCREEN_W = PHONE_W - BEZEL * 2;
const SCREEN_H = PHONE_H - BEZEL * 2;
const FRAME_RADIUS = 96;
const SCREEN_RADIUS = 78;
// Phone is portrait; canvas is 16:9. Scale the whole phone down so it fits
// the landscape frame with some vertical breathing room.
const PHONE_SCALE = 0.6;

// Safe-area insets so the inner composition doesn't render behind the
// dynamic island / notch (top) or the home indicator (bottom). The bottom
// dock matches the top device chrome so content sits in a symmetric column.
const DYNAMIC_ISLAND_TOP = 22;
const DYNAMIC_ISLAND_HEIGHT = 56;
const NOTCH_HEIGHT = 38;
const HOME_INDICATOR_BOTTOM = 14;
const HOME_INDICATOR_HEIGHT = 6;
const HOME_INDICATOR_INSET = HOME_INDICATOR_BOTTOM + HOME_INDICATOR_HEIGHT + 14; // 34
const SAFE_INSETS = {
  "dynamic-island": {
    top: DYNAMIC_ISLAND_TOP + DYNAMIC_ISLAND_HEIGHT + 20, // 98
    bottom: HOME_INDICATOR_INSET, // 34
  },
  notch: {
    top: NOTCH_HEIGHT + 20, // 58
    bottom: HOME_INDICATOR_INSET, // 34
  },
  // No top chrome — symmetric padding that matches the home-indicator dock.
  plain: {
    top: HOME_INDICATOR_INSET, // 34
    bottom: HOME_INDICATOR_INSET, // 34
  },
} as const;

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  device,
  innerCompositionId,
  screenImage,
  innerProps,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();
  const s = resolveClipStyle(clipStyle, {
    background: "#ffffff",
    color: "#0f1014",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    accent: "#0a84ff",
  });

  const drop = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 110, mass: 0.85 },
  });
  const scale = (0.9 + drop * 0.1) * PHONE_SCALE;
  const ty = (1 - drop) * 60;

  const Component = componentsById[innerCompositionId];
  const innerInfo = compositionsById[innerCompositionId];

  return (
    <AbsoluteFill
      style={{
        background: s.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: PHONE_W,
          height: PHONE_H,
          background:
            "linear-gradient(150deg, #2a2a2e 0%, #0f0f12 50%, #1a1a1d 100%)",
          borderRadius: FRAME_RADIUS,
          padding: BEZEL,
          boxShadow:
            "0 60px 140px rgba(0,0,0,0.45), 0 0 0 2px rgba(255,255,255,0.06), inset 0 0 0 2px rgba(255,255,255,0.05)",
          opacity: drop,
          transform: `translate3d(0, ${snap(ty)}px, 0) scale(${scale})`,
          position: "relative",
        }}
      >
        <SideButton side="left" top={260} length={140} />
        <SideButton side="left" top={420} length={86} />
        <SideButton side="left" top={520} length={86} />
        <SideButton side="right" top={340} length={170} />

        <div
          style={{
            width: SCREEN_W,
            height: SCREEN_H,
            background: "#000",
            borderRadius: SCREEN_RADIUS,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {screenImage ? (
            <Img
              src={proxyExternalImg(screenImage)}
              crossOrigin="anonymous"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : Component && innerInfo ? (
            <ScaledScene
              Component={Component}
              compW={innerInfo.width}
              compH={innerInfo.height}
              defaultProps={innerInfo.defaultProps}
              overrideProps={innerProps}
              insetTop={SAFE_INSETS[device].top}
              insetBottom={SAFE_INSETS[device].bottom}
              fitMode={innerInfo.phoneFitMode ?? "width"}
            />
          ) : (
            <FallbackScreen />
          )}

          {device === "dynamic-island" ? (
            <DynamicIsland />
          ) : device === "notch" ? (
            <Notch />
          ) : null}

          <HomeIndicator />
        </div>
      </div>
    </AbsoluteFill>
  );
};

function ScaledScene({
  Component,
  compW,
  compH,
  defaultProps,
  overrideProps,
  insetTop,
  insetBottom,
  fitMode,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: React.ComponentType<any>;
  compW: number;
  compH: number;
  defaultProps: Record<string, unknown>;
  overrideProps?: Record<string, unknown>;
  insetTop: number;
  insetBottom: number;
  fitMode: PhoneFitMode;
}) {
  // Pick the scale based on the composition's declared phoneFitMode:
  //   - "cover":  fill the full screen, may crop (chat in portrait mode).
  //   - "width":  fit to phone width, vertical letterbox (landscape stuff).
  //   - "contain": fit whole composition, both-axis letterbox.
  let fit: number;
  if (fitMode === "cover") {
    fit = Math.max(SCREEN_W / compW, SCREEN_H / compH);
  } else if (fitMode === "contain") {
    fit = Math.min(SCREEN_W / compW, SCREEN_H / compH);
  } else {
    fit = SCREEN_W / compW;
  }

  const renderedW = compW * fit;
  const renderedH = compH * fit;
  const offsetX = (SCREEN_W - renderedW) / 2;
  const offsetY = (SCREEN_H - renderedH) / 2;

  const merged = overrideProps
    ? { ...defaultProps, ...overrideProps }
    : defaultProps;

  // Safe-area padding only matters for "cover" mode — the inner composition
  // fills the entire screen and would otherwise sit under the dynamic island
  // and home indicator. For "width" / "contain" the composition is centered
  // with letterbox, so it doesn't reach those chrome zones to begin with.
  const safeArea =
    fitMode === "cover"
      ? { top: insetTop / fit, bottom: insetBottom / fit }
      : { top: 0, bottom: 0 };

  return (
    <div
      style={{
        position: "absolute",
        left: offsetX,
        top: offsetY,
        width: compW,
        height: compH,
        transform: `scale(${fit})`,
        transformOrigin: "top left",
      }}
    >
      <SafeAreaContext.Provider value={safeArea}>
        <Component {...merged} />
      </SafeAreaContext.Provider>
    </div>
  );
}

function FallbackScreen() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,0.4)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        fontSize: 28,
      }}
    >
      Pick a composition
    </div>
  );
}

function DynamicIsland() {
  return (
    <div
      style={{
        position: "absolute",
        top: 22,
        left: "50%",
        transform: "translateX(-50%)",
        width: 240,
        height: 56,
        background: "#000",
        borderRadius: 999,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingRight: 22,
        gap: 6,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#1c1c1f",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
        }}
      />
    </div>
  );
}

function Notch() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: 360,
        height: 38,
        background: "#000",
        borderBottomLeftRadius: 22,
        borderBottomRightRadius: 22,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
      }}
    >
      <span
        style={{
          width: 60,
          height: 8,
          background: "#101012",
          borderRadius: 999,
        }}
      />
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#101012",
        }}
      />
    </div>
  );
}

function HomeIndicator() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 14,
        left: "50%",
        transform: "translateX(-50%)",
        width: 270,
        height: 6,
        background: "rgba(255,255,255,0.55)",
        borderRadius: 999,
        mixBlendMode: "exclusion",
      }}
    />
  );
}

function SideButton({
  side,
  top,
  length,
}: {
  side: "left" | "right";
  top: number;
  length: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        [side]: -3,
        width: 5,
        height: length,
        background:
          "linear-gradient(90deg, #1a1a1c 0%, #3a3a3e 50%, #1a1a1c 100%)",
        borderRadius: 2,
      }}
    />
  );
}
