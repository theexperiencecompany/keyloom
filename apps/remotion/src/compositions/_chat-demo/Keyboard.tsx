"use client";

/**
 * iOS keyboard — built at the exact geometry of the Figma export
 * (`iOS 27 Safari UI Keyboards/Keyboard/Default.svg`, viewBox 402×306, rows at
 * y=16/71/126/181, letter keys 33.55×45 rx 8.5). Rebuilt as addressable React
 * keys (instead of one opaque SVG) so each key can drive the iconic press
 * "pop" balloon and stay in sync with the composer's typed text.
 *
 * Only the Figma `<foreignObject>` backdrop-blur wrapper from the original SVG
 * doesn't survive the canvas export — every actual key shape/letter does, so
 * this renders identically in the studio Player and in `remotion render`.
 */

import { useLayoutEffect, useRef, useState } from "react";
import { useDesignFrame } from "../../use-design-frame";

const KB_W = 402;
// Keys end at y=226 (row 4 bottom). Below that iOS shows a utility bar with the
// globe (switch keyboard) on the left and the dictation mic on the right, so we
// keep room for it; the phone frame still draws its own home indicator below.
const KB_H = 296;
// Vertical centre of the globe/mic bar that sits under the key rows.
const UTILITY_Y = 250;
// A touch of side breathing room beyond the native 4px key margin.
const KB_PAD_X = 4;

const SF_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

export type KeyboardTheme = "light" | "dark";

type KeyKind = "letter" | "fn" | "space" | "return";

type KKey = {
  /** Visible label (also the match target for letters). */
  label: string;
  /** Lowercased character this key types (letters + space). */
  char?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: KeyKind;
};

const ROW1 = "qwertyuiop";
const ROW2 = "asdfghjkl";
const ROW3 = "zxcvbnm";

function buildKeys(): KKey[] {
  const keys: KKey[] = [];
  // Row 1 — 10 letters.
  ROW1.split("").forEach((c, i) => {
    keys.push({
      label: c,
      char: c,
      x: 4 + i * 40.05,
      y: 16,
      w: 33.55,
      h: 45,
      kind: "letter",
    });
  });
  // Row 2 — 9 letters, inset.
  ROW2.split("").forEach((c, i) => {
    keys.push({
      label: c,
      char: c,
      x: 20 + i * 40.9445,
      y: 71,
      w: 34.4444,
      h: 45,
      kind: "letter",
    });
  });
  // Row 3 — shift, 7 letters, delete.
  keys.push({ label: "⇧", x: 4, y: 126, w: 49.5, h: 45, kind: "fn" });
  ROW3.split("").forEach((c, i) => {
    keys.push({
      label: c,
      char: c,
      x: 60 + i * 41.214,
      y: 126,
      w: 34.7143,
      h: 45,
      kind: "letter",
    });
  });
  keys.push({ label: "⌫", x: 348.5, y: 126, w: 49.5, h: 45, kind: "fn" });
  // Row 4 — 123, globe, space, return.
  keys.push({ label: "123", x: 4, y: 181, w: 42, h: 45, kind: "fn" });
  keys.push({ label: "🌐", x: 52, y: 181, w: 43, h: 45, kind: "fn" });
  keys.push({
    label: "space",
    char: " ",
    x: 101,
    y: 181,
    w: 177,
    h: 45,
    kind: "space",
  });
  keys.push({ label: "return", x: 284, y: 181, w: 114, h: 45, kind: "return" });
  return keys;
}

const KEYS = buildKeys();

/** Keyboard surface color per appearance — also used to tint the phone's
 *  home-indicator strip so the keyboard reads as one continuous surface.
 *  Dark is a slightly elevated grey (iOS keyboard panel) rather than pure
 *  black, so the keyboard reads as its own surface instead of melting into a
 *  black chat sheet. The translucent keys still self-define the layout. */
export const KEYBOARD_BG: Record<KeyboardTheme, string> = {
  light: "#D1D4DB",
  dark: "#1C1C1E",
};

type Palette = {
  bg: string;
  letterKey: string;
  letterKeyShadow: string;
  fnKey: string;
  returnKey: string;
  text: string;
  fnText: string;
  smiley: string;
  pressedKey: string;
  balloon: string;
  balloonText: string;
  balloonShadow: string;
};

const PALETTES: Record<KeyboardTheme, Palette> = {
  light: {
    bg: KEYBOARD_BG.light,
    letterKey: "#FFFFFF",
    letterKeyShadow: "0 1px 0 rgba(0,0,0,0.30)",
    fnKey: "#ABB0BB",
    returnKey: "#ABB0BB",
    text: "#000000",
    fnText: "#000000",
    smiley: "#8A8A8E",
    pressedKey: "#E4E6EB",
    balloon: "#FFFFFF",
    balloonText: "#000000",
    balloonShadow: "0 6px 14px rgba(0,0,0,0.28)",
  },
  dark: {
    bg: KEYBOARD_BG.dark,
    letterKey: "rgba(255,255,255,0.27)",
    letterKeyShadow: "0 1px 0 rgba(0,0,0,0.45)",
    fnKey: "rgba(255,255,255,0.12)",
    returnKey: "rgba(255,255,255,0.12)",
    text: "#FFFFFF",
    fnText: "#FFFFFF",
    smiley: "#AEAEB2",
    pressedKey: "rgba(255,255,255,0.5)",
    balloon: "#6E6E70",
    balloonText: "#FFFFFF",
    balloonShadow: "0 6px 14px rgba(0,0,0,0.5)",
  },
};

export type KeyboardProps = {
  theme?: KeyboardTheme;
  /** Character currently pressed (lowercased letter or " "). */
  pressedKey?: string | null;
  /** 0→1 press animation progress for the pop balloon. */
  pressT?: number;
};

function ShiftIcon({ color }: { color: string }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.6 21 12.6H16.2V19.2H7.8V12.6H3L12 3.6Z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BackspaceIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="22" viewBox="0 0 28 22" fill="none" aria-hidden>
      <path
        d="M9.4 2.6H24.4C25.6 2.6 26.6 3.6 26.6 4.8V17.2C26.6 18.4 25.6 19.4 24.4 19.4H9.4L1.4 11Z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M13 8 19 14M19 8 13 14"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SmileyIcon({ color }: { color: string }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.7" />
      <circle cx="8.8" cy="10" r="1.15" fill={color} />
      <circle cx="15.2" cy="10" r="1.15" fill={color} />
      <path
        d="M8 14.2a4.2 4.2 0 0 0 8 0"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GlobeIcon({ color }: { color: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <path d="M3 12h18" stroke={color} strokeWidth="1.5" />
      <path
        d="M12 3c2.5 2.4 3.9 5.6 3.9 9s-1.4 6.6-3.9 9c-2.5-2.4-3.9-5.6-3.9-9S9.5 5.4 12 3Z"
        stroke={color}
        strokeWidth="1.5"
      />
      <path d="M4.4 8.2h15.2M4.4 15.8h15.2" stroke={color} strokeWidth="1.3" />
    </svg>
  );
}

function MicIcon({ color }: { color: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="2.6"
        width="6"
        height="11.4"
        rx="3"
        stroke={color}
        strokeWidth="1.6"
      />
      <path
        d="M5.5 11.4a6.5 6.5 0 0 0 13 0"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 17.9V21"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Keyboard({
  theme = "light",
  pressedKey = null,
  pressT = 0,
}: KeyboardProps) {
  const frame = useDesignFrame();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(KB_W);

  // Measure once per frame (cheap, stable) so the native-coord layer scales to
  // whatever width the chat column gives us — same approach as LiquidGlass.
  useLayoutEffect(() => {
    if (wrapRef.current) {
      const cw = wrapRef.current.clientWidth;
      if (cw > 0) setW(cw);
    }
  }, [frame]);

  const scale = Math.max(0, w - KB_PAD_X * 2) / KB_W;
  const p = PALETTES[theme];

  const active =
    pressedKey != null
      ? KEYS.find((k) => k.char === pressedKey.toLowerCase())
      : undefined;

  // Pop balloon geometry (native coords) for the active letter key.
  const pop = Math.max(0, Math.min(1, pressT));
  const balloon =
    active && active.kind === "letter"
      ? (() => {
          const bw = active.w * 1.34;
          const bh = active.h * 1.18;
          const cx = active.x + active.w / 2;
          return {
            key: active,
            bw,
            bh,
            left: cx - bw / 2,
            top: active.y - bh - 2,
            neckW: active.w * 0.74,
            neckLeft: cx - (active.w * 0.74) / 2,
            neckTop: active.y - bh - 2 + bh * 0.6,
            neckH: active.y + active.h * 0.2 - (active.y - bh - 2 + bh * 0.6),
            char: active.label,
          };
        })()
      : null;

  return (
    <div
      ref={wrapRef}
      style={{
        width: "100%",
        height: KB_H * scale,
        position: "relative",
        fontFamily: SF_STACK,
      }}
    >
      {/* Keyboard panel surface — its own layer with generously rounded TOP
          corners + a soft glass rim along the top edge, matching the liquid
          glass chrome (call button / name chip). Kept separate from the
          key/balloon clip below so the balloon's upward overflow can't square
          these corners off. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: p.bg,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          boxShadow:
            theme === "dark"
              ? "inset 0 1px 0 rgba(255,255,255,0.10), inset 1px 0 0 rgba(255,255,255,0.05), inset -1px 0 0 rgba(255,255,255,0.05)"
              : "inset 0 1px 0 rgba(255,255,255,0.55)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          // Let the key-press pop balloon overflow ABOVE the top row, but keep
          // the sides/bottom clipped so nothing spills past the keyboard edges.
          clipPath: "inset(-120px 0 0 0)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: KB_PAD_X,
            width: KB_W,
            height: KB_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {KEYS.map((k, i) => {
            const isPressed = active === k && k.kind === "letter";
            const isShift = k.label === "⇧";
            const isDelete = k.label === "⌫";
            const isGlobe = k.label === "🌐";
            const bg =
              k.kind === "letter"
                ? isPressed
                  ? p.pressedKey
                  : p.letterKey
                : k.kind === "return"
                  ? p.returnKey
                  : p.fnKey;
            const fontSize =
              k.kind === "letter"
                ? 22
                : k.kind === "space"
                  ? 15
                  : k.label === "123"
                    ? 16
                    : 17;
            // The pressed letter hides its own glyph — it now lives in the balloon.
            const showGlyph = !(isPressed && balloon);
            let content: React.ReactNode = "";
            if (showGlyph) {
              if (isShift) content = <ShiftIcon color={p.fnText} />;
              else if (isDelete) content = <BackspaceIcon color={p.fnText} />;
              else if (isGlobe) content = <SmileyIcon color={p.smiley} />;
              else if (k.kind === "space") content = "";
              else if (k.kind === "return") content = "return";
              else content = k.label;
            }
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: k.x,
                  top: k.y,
                  width: k.w,
                  height: k.h,
                  borderRadius: 8.5,
                  background: bg,
                  boxShadow: p.letterKeyShadow,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: k.kind === "letter" ? p.text : p.fnText,
                  fontSize,
                  fontWeight: 400,
                  letterSpacing: k.kind === "space" ? "0.04em" : 0,
                  lineHeight: 1,
                }}
              >
                {content}
              </div>
            );
          })}

          {/* Utility bar below the keys: globe (switch keyboard) on the left,
            dictation mic on the right — both plain icons on the surface. */}
          <div
            style={{
              position: "absolute",
              left: 18,
              top: UTILITY_Y - 15,
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GlobeIcon color={p.smiley} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 358,
              top: UTILITY_Y - 13,
              width: 26,
              height: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MicIcon color={p.smiley} />
          </div>

          {/* Press "pop" balloon — neck first (behind), then the balloon head. */}
          {balloon && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: balloon.neckLeft,
                  top: balloon.neckTop,
                  width: balloon.neckW,
                  height: Math.max(0, balloon.neckH),
                  background: p.balloon,
                  borderRadius: 6,
                  opacity: pop,
                  transform: `scaleY(${0.6 + 0.4 * pop})`,
                  transformOrigin: "bottom center",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: balloon.left,
                  top: balloon.top,
                  width: balloon.bw,
                  height: balloon.bh,
                  background: p.balloon,
                  borderRadius: 12,
                  boxShadow: p.balloonShadow,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: p.balloonText,
                  fontSize: 30,
                  fontWeight: 400,
                  opacity: pop,
                  transform: `translateY(${(1 - pop) * 8}px) scale(${0.82 + 0.18 * pop})`,
                  transformOrigin: "bottom center",
                }}
              >
                {balloon.char}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
