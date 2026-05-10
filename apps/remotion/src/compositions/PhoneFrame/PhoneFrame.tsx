"use client";
import {
  AbsoluteFill,
  Img,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { componentsByIdBase as componentsById } from "../../componentsBase";
import { compositionsById } from "../../registry";

export type PhoneFrameProps = {
  device: "dynamic-island" | "notch";
  innerCompositionId: string;
  screenImage: string;
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

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  device,
  innerCompositionId,
  screenImage,
  clipStyle,
}) => {
  const frame = useCurrentFrame();
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
          transform: `translateY(${ty}px) scale(${scale})`,
          willChange: "transform, opacity",
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
              src={screenImage}
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
            />
          ) : (
            <FallbackScreen />
          )}

          {device === "dynamic-island" ? <DynamicIsland /> : <Notch />}

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
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: React.ComponentType<any>;
  compW: number;
  compH: number;
  defaultProps: Record<string, unknown>;
}) {
  const fit = Math.max(SCREEN_W / compW, SCREEN_H / compH);
  const renderedW = compW * fit;
  const renderedH = compH * fit;
  const offsetX = (SCREEN_W - renderedW) / 2;
  const offsetY = (SCREEN_H - renderedH) / 2;

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
      <Component {...defaultProps} />
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
