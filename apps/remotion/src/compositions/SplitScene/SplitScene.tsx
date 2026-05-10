"use client";
import { AbsoluteFill } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { componentsByIdBase as componentsById } from "../../componentsBase";
import { compositionsById } from "../../registry";
import type { SplitLayout } from "./layout";

export type { SplitLayout } from "./layout";

export type SplitSceneProps = {
  layout: SplitLayout;
  slots: string[];
  gap: number;
  clipStyle?: ClipStyle;
};

const CANVAS_W = 1920;
const CANVAS_H = 1080;

type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: number;
  shadow?: boolean;
};

function getSlotRects(layout: SplitLayout, gap: number): Rect[] {
  const g = Math.max(0, gap);

  switch (layout) {
    case "stacked": {
      const h = (CANVAS_H - g) / 2;
      return [
        { x: 0, y: 0, w: CANVAS_W, h },
        { x: 0, y: h + g, w: CANVAS_W, h },
      ];
    }
    case "side-by-side": {
      const w = (CANVAS_W - g) / 2;
      return [
        { x: 0, y: 0, w, h: CANVAS_H },
        { x: w + g, y: 0, w, h: CANVAS_H },
      ];
    }
    case "pip": {
      const insetW = CANVAS_W * 0.32;
      const insetH = CANVAS_H * 0.32;
      const margin = 56;
      return [
        { x: 0, y: 0, w: CANVAS_W, h: CANVAS_H },
        {
          x: CANVAS_W - insetW - margin,
          y: CANVAS_H - insetH - margin,
          w: insetW,
          h: insetH,
          radius: 28,
          shadow: true,
        },
      ];
    }
    case "grid-2x2": {
      const w = (CANVAS_W - g) / 2;
      const h = (CANVAS_H - g) / 2;
      return [
        { x: 0, y: 0, w, h },
        { x: w + g, y: 0, w, h },
        { x: 0, y: h + g, w, h },
        { x: w + g, y: h + g, w, h },
      ];
    }
  }
}

export const SplitScene: React.FC<SplitSceneProps> = ({
  layout,
  slots,
  gap,
  clipStyle,
}) => {
  const s = resolveClipStyle(clipStyle, {
    background: "#0f1014",
    color: "#ffffff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    accent: "#6366f1",
  });
  const rects = getSlotRects(layout, gap);

  return (
    <AbsoluteFill style={{ background: s.background, overflow: "hidden" }}>
      {rects.map((rect, i) => {
        const compId = slots[i];
        return <Slot key={i} rect={rect} compositionId={compId ?? ""} />;
      })}
    </AbsoluteFill>
  );
};

function Slot({ rect, compositionId }: { rect: Rect; compositionId: string }) {
  const Component = componentsById[compositionId];
  const info = compositionsById[compositionId];
  const radius = rect.radius ?? 0;
  const shadow = rect.shadow
    ? "0 30px 80px rgba(0,0,0,0.45), 0 0 0 2px rgba(255,255,255,0.08)"
    : undefined;

  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        background: "#000",
        borderRadius: radius,
        overflow: "hidden",
        boxShadow: shadow,
      }}
    >
      {Component && info ? (
        <ScaledScene
          Component={Component}
          compW={info.width}
          compH={info.height}
          slotW={rect.w}
          slotH={rect.h}
          defaultProps={info.defaultProps}
        />
      ) : (
        <EmptySlot />
      )}
    </div>
  );
}

function ScaledScene({
  Component,
  compW,
  compH,
  slotW,
  slotH,
  defaultProps,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: React.ComponentType<any>;
  compW: number;
  compH: number;
  slotW: number;
  slotH: number;
  defaultProps: Record<string, unknown>;
}) {
  const fit = Math.max(slotW / compW, slotH / compH);
  const renderedW = compW * fit;
  const renderedH = compH * fit;
  const offsetX = (slotW - renderedW) / 2;
  const offsetY = (slotH - renderedH) / 2;

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

function EmptySlot() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,0.35)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        fontSize: 22,
      }}
    >
      Empty slot
    </div>
  );
}
