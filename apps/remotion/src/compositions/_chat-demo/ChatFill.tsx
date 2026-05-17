"use client";
import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { useSafeArea } from "../../safe-area";

type Orientation = "landscape" | "portrait";

type Props = {
  /** Color rendered outside the chat tile (and behind the chat in portrait). */
  backdrop?: string;
  scale?: number;
  /**
   * Color used for the safe-area padding bars at the top/bottom of the
   * portrait viewport. Should match the chat's chrome (header/composer)
   * color so the chrome reads as a single continuous bar that extends
   * under the device's dynamic island and home indicator. Defaults to
   * `backdrop` if not provided.
   */
  chromeColor?: string;
  /**
   * Landscape (default): fills the parent with the chat scaled up for
   * standalone viewing. Portrait: renders the chat inside a centered
   * phone-aspect column (9:19.5) sized to the parent's height so it
   * reads correctly when wrapped in PhoneFrame.
   *
   * All sizing is parent-relative — never call useVideoConfig() here.
   * When this composition is nested inside a wrapper (e.g. PhoneFrame),
   * useVideoConfig returns the wrapper's canvas dims, not ours, which
   * mis-positions everything.
   */
  orientation?: Orientation;
  children: ReactNode;
};

// 9:19.5 — modern iPhone screen aspect ratio.
const PORTRAIT_ASPECT = "9 / 19.5";

export function ChatFill({
  backdrop,
  scale = 1.6,
  chromeColor,
  orientation = "landscape",
  children,
}: Props) {
  const safe = useSafeArea();
  const padColor = chromeColor ?? backdrop ?? "#000";

  // Auto-portrait when nested inside a device frame (PhoneFrame provides a
  // non-default SafeAreaContext). Landscape chat inside a phone always looks
  // wrong — it cover-fits over the tall screen and crops the conversation
  // down to a narrow vertical slice. Defaulting to portrait there matches
  // every realistic use case.
  const inDeviceFrame = safe.top > 0 || safe.bottom > 0;
  const effectiveOrientation =
    inDeviceFrame && orientation === "landscape" ? "portrait" : orientation;

  if (effectiveOrientation === "portrait") {
    return (
      <AbsoluteFill
        style={{
          background: backdrop ?? "#000",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "50%",
            aspectRatio: PORTRAIT_ASPECT,
            transform: "translateX(-50%)",
            background: padColor,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {safe.top > 0 && <div style={{ flexShrink: 0, height: safe.top }} />}
          <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
            {children}
          </div>
          {safe.bottom > 0 && (
            <div style={{ flexShrink: 0, height: safe.bottom }} />
          )}
        </div>
      </AbsoluteFill>
    );
  }

  // Landscape: render the chat at (100 / scale)% of the parent, then scale
  // up to fill — gives the chat a smaller design-px size while still
  // covering the canvas. Parent-relative so this works at any nesting depth.
  const pct = 100 / scale;
  return (
    <AbsoluteFill
      style={{ background: backdrop ?? "#000", overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${pct}%`,
          height: `${pct}%`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
}
