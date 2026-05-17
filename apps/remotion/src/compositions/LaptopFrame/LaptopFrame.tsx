"use client";
import { AbsoluteFill, Img, spring, useVideoConfig } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { componentsByIdBase as componentsById } from "../../componentsBase";
import { proxyExternalImg } from "../../proxy-image";
import { compositionsById } from "../../registry";
import { snap } from "../../snap";
import { useDesignFrame } from "../../use-design-frame";

export type LaptopFrameProps = {
  chassis: "silver" | "space-gray";
  innerCompositionId: string;
  screenImage: string;
  innerProps?: Record<string, unknown>;
  clipStyle?: ClipStyle;
};

const LID_W = 1440;
const LID_H = 900;
const BEZEL = 22;
const SCREEN_W = LID_W - BEZEL * 2;
const SCREEN_H = LID_H - BEZEL * 2;
const LID_RADIUS = 26;
const SCREEN_RADIUS = 8;
const HINGE_GAP = 4;
const BASE_LIP_W = 1560;
const BASE_LIP_H = 26;
const BASE_LIP_RADIUS = 6;
const BOTTOM_SHADOW_W = 1620;
const BOTTOM_SHADOW_H = 8;

type ChassisColors = {
  lidEdge: string;
  baseLip: string;
  baseLipShadow: string;
  bottomShadow: string;
};

function getChassis(chassis: LaptopFrameProps["chassis"]): ChassisColors {
  if (chassis === "space-gray") {
    return {
      lidEdge: "linear-gradient(180deg, #2a2a2e 0%, #1a1a1d 50%, #242427 100%)",
      baseLip: "linear-gradient(180deg, #1f1f22 0%, #2c2c30 30%, #1a1a1d 100%)",
      baseLipShadow: "0 4px 14px rgba(0,0,0,0.45)",
      bottomShadow: "rgba(0,0,0,0.55)",
    };
  }
  return {
    lidEdge: "linear-gradient(180deg, #d8d8de 0%, #c0c0c8 55%, #d4d4da 100%)",
    baseLip: "linear-gradient(180deg, #c4c4ca 0%, #d8d8de 30%, #b6b6bc 100%)",
    baseLipShadow: "0 4px 14px rgba(15,16,20,0.18)",
    bottomShadow: "rgba(15,16,20,0.25)",
  };
}

export const LaptopFrame: React.FC<LaptopFrameProps> = ({
  chassis,
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
  const scale = 0.9 + drop * 0.1;
  const ty = (1 - drop) * 60;

  const Component = componentsById[innerCompositionId];
  const innerInfo = compositionsById[innerCompositionId];
  const colors = getChassis(chassis);

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
          opacity: drop,
          transform: `translate3d(0, ${snap(ty)}px, 0) scale(${scale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Display / lid */}
        <div
          style={{
            width: LID_W,
            height: LID_H,
            background: colors.lidEdge,
            borderRadius: LID_RADIUS,
            padding: BEZEL,
            position: "relative",
            boxShadow:
              "0 60px 140px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.05)",
          }}
        >
          {/* Camera notch dot */}
          <div
            style={{
              position: "absolute",
              top: BEZEL / 2 - 2,
              left: "50%",
              transform: "translateX(-50%)",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#0a0a0c",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          />

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
              />
            ) : (
              <FallbackScreen />
            )}
          </div>
        </div>

        {/* Hinge gap */}
        <div style={{ height: HINGE_GAP }} />

        {/* Base lip — slightly wider than lid */}
        <div
          style={{
            width: BASE_LIP_W,
            height: BASE_LIP_H,
            background: colors.baseLip,
            borderRadius: BASE_LIP_RADIUS,
            boxShadow: colors.baseLipShadow,
            position: "relative",
          }}
        >
          {/* Trackpad cutout indicator */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 220,
              height: 4,
              borderRadius: 2,
              background: "rgba(0,0,0,0.18)",
            }}
          />
        </div>

        {/* Bottom contact shadow */}
        <div
          style={{
            width: BOTTOM_SHADOW_W,
            height: BOTTOM_SHADOW_H,
            marginTop: 4,
            borderRadius: 999,
            background: `radial-gradient(ellipse at center, ${colors.bottomShadow} 0%, transparent 75%)`,
            filter: "blur(2px)",
          }}
        />
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
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: React.ComponentType<any>;
  compW: number;
  compH: number;
  defaultProps: Record<string, unknown>;
  overrideProps?: Record<string, unknown>;
}) {
  // Contain mode: fit the whole composition inside the screen with letterbox if needed.
  const fit = Math.min(SCREEN_W / compW, SCREEN_H / compH);
  const renderedW = compW * fit;
  const renderedH = compH * fit;
  const offsetX = (SCREEN_W - renderedW) / 2;
  const offsetY = (SCREEN_H - renderedH) / 2;

  const merged = overrideProps
    ? { ...defaultProps, ...overrideProps }
    : defaultProps;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#000",
      }}
    >
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
        <Component {...merged} />
      </div>
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
