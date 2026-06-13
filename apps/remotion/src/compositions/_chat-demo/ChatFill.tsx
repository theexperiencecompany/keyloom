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
   * Color for the BOTTOM safe-area bar only (defaults to `chromeColor`). Lets a
   * composition with an on-screen keyboard tint just the home-indicator strip
   * to the keyboard color so it reads as one continuous surface, while the top
   * bar stays the header/backdrop color.
   */
  bottomChromeColor?: string;
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

// Matches PhoneFrame's inner screen aspect (724×1524) so the chat fills the
// device edge-to-edge with no side bars when wrapped in PhoneFrame. Visually
// identical to a 9:19.5 phone for standalone portrait use.
const PORTRAIT_ASPECT = "724 / 1524";

export function ChatFill({
  backdrop,
  scale = 1.6,
  chromeColor,
  bottomChromeColor,
  orientation = "landscape",
  children,
}: Props) {
  const safe = useSafeArea();
  const padColor = chromeColor ?? backdrop ?? "#000";
  const bottomPadColor = bottomChromeColor ?? padColor;

  // Auto-portrait when nested inside a device frame (PhoneFrame provides a
  // non-default SafeAreaContext). Landscape chat inside a phone always looks
  // wrong — it cover-fits over the tall screen and crops the conversation
  // down to a narrow vertical slice. Defaulting to portrait there matches
  // every realistic use case.
  const inDeviceFrame = safe.top > 0 || safe.bottom > 0;

  // Inside a device frame (PhoneFrame): fit the chat to the phone screen,
  // honoring the safe-area insets the frame provides.
  if (inDeviceFrame) {
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
            <div
              style={{
                flexShrink: 0,
                height: safe.bottom,
                background: bottomPadColor,
              }}
            />
          )}
        </div>
      </AbsoluteFill>
    );
  }

  // Standalone (no device frame): render the chat at (100 / scale)% of the
  // parent, then scale up to FILL the whole canvas — works the same for a 16:9
  // landscape canvas or a 9:16 portrait canvas. The canvas dimensions (set from
  // the Orientation prop) decide the shape; the chat always fills it instead of
  // sitting in a narrow centered column with black side bars.
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
