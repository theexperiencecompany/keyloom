"use client";

/**
 * iMessage "+" attachment flow, animated for the video: tapping the composer's
 * plus button opens the attachment menu card (Halo AI / Camera / Photos /
 * Stickers / Audio / Store), Photos is tapped, a photo grid slides up over the
 * keyboard, the target photo is tapped, then it sends.
 *
 * Driven by a single `t` (0→1) progress so it stays in lockstep with the
 * conversation timeline (buildChatState derives `t` from the frame). It renders
 * as an absolute overlay filling the keyboard slot, so the layout never jumps —
 * the menu card floats over the dimmed keyboard, then the grid covers it.
 *
 * All visuals are flat CSS/SVG (no WebGL, no backdrop-filter) so the studio
 * Player and the export look identical — same rule as the rest of MessageBubbles.
 */

import { Easing, Img, interpolate } from "remotion";
import { asset } from "../_chat-demo/ChatDemo";

const SF_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

const MENU_ITEMS = [
  { key: "halo", label: "Halo AI" },
  { key: "camera", label: "Camera" },
  { key: "photos", label: "Photos" },
  { key: "stickers", label: "Stickers" },
  { key: "audio", label: "Audio" },
  { key: "store", label: "Store" },
] as const;

/** Real iOS app-icon images for the rows that ship one (in
 *  apps/web/public/components/messagebubble/); the rest fall back to a flat
 *  CSS/SVG icon. */
const ICON_PNG: Record<string, string> = {
  halo: "haloai.png",
  camera: "camera.png",
  photos: "photos.png",
  audio: "audio.png",
  store: "store.png",
};

function MenuIcon({ kind }: { kind: string }) {
  const png = ICON_PNG[kind];
  if (png) {
    return (
      <Img
        src={asset(`components/messagebubble/${png}`) ?? ""}
        crossOrigin="anonymous"
        alt=""
        style={{
          width: 30,
          height: 30,
          borderRadius: 7,
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  const base: React.CSSProperties = {
    width: 30,
    height: 30,
    // Rounded square (app-icon shape) to match the real PNG icons above.
    borderRadius: 7,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25)",
  };
  // Only "Stickers" has no PNG yet — flat CSS icon.
  return (
    <div
      style={{
        ...base,
        background: "linear-gradient(160deg, #c76bff 0%, #9b3fe0 100%)",
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9 6.7 19.1l1-5.8L3.5 9.2l5.9-.9z"
          fill="#fff"
        />
      </svg>
    </div>
  );
}

/** Deterministic gradient "photos" to fill the grid around the real one. */
const FILLER_GRADIENTS = [
  "linear-gradient(135deg, #6a85b6, #bac8e0)",
  "linear-gradient(135deg, #f6d365, #fda085)",
  "linear-gradient(135deg, #84fab0, #8fd3f4)",
  "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  "linear-gradient(135deg, #ff9a9e, #fad0c4)",
  "linear-gradient(135deg, #30cfd0, #330867)",
  "linear-gradient(135deg, #5ee7df, #b490ca)",
  "linear-gradient(135deg, #d299c2, #fef9d7)",
];

export function PhotoPicker({
  image,
  t,
  theme = "dark",
}: {
  image: string;
  /** 0→1 progress through the whole attachment flow. */
  t: number;
  theme?: "light" | "dark";
}) {
  const dark = theme !== "light";
  const panelBg = dark ? "#1c1c1e" : "#d1d4db";
  const labelColor = dark ? "#ffffff" : "#000000";
  const rowDivider = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";

  const ease = (a: number, b: number, easing = Easing.out(Easing.cubic)) =>
    interpolate(t, [a, b], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing,
    });

  // Phases — snappy, with minimal dead time between steps so it doesn't drag.
  // Each action (card up, Photos tap, grid, photo tap, fly) follows quickly.
  const menuIn = ease(0, 0.08); // card pops up after the + tap
  const photosTapped = t >= 0.16 && t < 0.26; // Photos row pressed
  const toGrid = ease(0.26, 0.38, Easing.out(Easing.cubic)); // 0 menu → 1 grid
  const photoTap = ease(0.5, 0.6); // the chosen tile presses
  // Grid slides away as the send finishes.
  const closing = ease(0.72, 1, Easing.out(Easing.cubic));
  // The chosen photo flies to the thread at a CONSTANT speed (no decel drift),
  // staying opaque almost the whole way so it reads as a direct send rather than
  // a slow dissolve in mid-air.
  const fly = ease(0.74, 1, Easing.linear);
  const menuVisible = menuIn * (1 - toGrid);

  const tiles = [image, ...FILLER_GRADIENTS];

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: SF_STACK }}>
      {/* Dim the whole screen behind the menu (messages + keyboard), like iOS
          when you tap +. It extends up into the message area (the keyboard slot
          allows the overflow) and fades out at the top so there's no hard edge —
          this is what lets the translucent card read as glass over a darkened
          backdrop rather than a flat gray panel. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          top: -460,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.6) 62%, rgba(0,0,0,0))",
          opacity: menuVisible,
          pointerEvents: "none",
        }}
      />

      {/* Photo grid — covers the keyboard once Photos is tapped. Fewer, bigger
          tiles (3×2) so the photos read clearly. Fades out as the chosen photo
          flies up to the thread. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          background: panelBg,
          opacity: toGrid,
          // Slide the grid cleanly down on close (instead of fading and exposing
          // the keyboard mid-transition).
          transform: `translateY(${closing * 100}%)`,
          padding: 7,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridAutoRows: "1fr",
          gap: 4,
        }}
      >
        {tiles.slice(0, 6).map((tile, i) => {
          const isTarget = i === 0;
          const tapScale = isTarget ? 1 - photoTap * 0.05 : 1;
          return (
            <div
              key={i}
              style={{
                position: "relative",
                borderRadius: 6,
                overflow: "hidden",
                // The chosen tile empties out as its photo flies to the thread.
                background: isTarget ? "#000" : tile,
                transform: `scale(${tapScale})`,
                boxShadow:
                  isTarget && photoTap > 0 ? "0 0 0 3px #0a84ff inset" : "none",
              }}
            >
              {isTarget && fly < 0.02 && (
                <Img
                  src={asset(tile) ?? ""}
                  crossOrigin="anonymous"
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
              {isTarget && photoTap > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 19,
                    height: 19,
                    borderRadius: 9999,
                    background: "#0a84ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 1 - closing,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
                    <path
                      d="M2.5 6.5l2.2 2.2L9.5 3.8"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* The chosen photo flying from its grid tile up toward the thread, so the
          send reads as "grid → message" like iMessage. It starts on the tile and
          lifts up-and-right, shrinking toward bubble size, then the real bubble
          (which lands as the flow ends) takes over. */}
      {fly > 0.001 && (
        <div
          style={{
            position: "absolute",
            // Top-left tile position (grid padding 7).
            left: 7,
            top: 7,
            width: "calc((100% - 22px) / 3)",
            aspectRatio: "1 / 1",
            borderRadius: 6 + fly * 10,
            overflow: "hidden",
            // Head up-and-right toward where the outgoing photo bubble lands
            // (just above the composer), shrinking toward bubble size. Stay
            // opaque almost all the way, then a quick fade as the real bubble
            // takes over at the very end.
            transform: `translate(${fly * 205}px, ${fly * -105}px) scale(${1 - fly * 0.42})`,
            transformOrigin: "center",
            opacity: fly < 0.85 ? 1 : Math.max(0, 1 - (fly - 0.85) / 0.15),
            boxShadow: "0 18px 44px rgba(0,0,0,0.5)",
            zIndex: 5,
          }}
        >
          <Img
            src={asset(image) ?? ""}
            crossOrigin="anonymous"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      {/* Attachment menu card — grows UP out of the + button (its bottom sits at
          the composer, above the keyboard slot) and floats over the messages
          like real iMessage, then fades into the grid. */}
      {menuVisible > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: 20,
            // Anchor the card's bottom at the top of the keyboard slot (= the
            // composer / + button), so it rises upward from the + instead of
            // sitting low in the keyboard area.
            bottom: "100%",
            marginBottom: 8,
            width: 240,
            // Liquid-glass material: a DARK, see-through frosted fill (not a
            // milky/whitish panel) with only a faint rim — over the dimmed
            // backdrop it reads as transparent dark glass. The blur is
            // progressive enhancement for the live Player; the translucent fill
            // carries the look in the export.
            background: dark ? "rgba(30,30,34,0.55)" : "rgba(250,250,252,0.7)",
            border: dark
              ? "1px solid rgba(255,255,255,0.1)"
              : "1px solid rgba(0,0,0,0.07)",
            backdropFilter: "blur(32px) saturate(150%)",
            WebkitBackdropFilter: "blur(32px) saturate(150%)",
            borderRadius: 16,
            padding: "3px 0",
            opacity: menuVisible,
            transform: `translateY(${(1 - menuIn) * 18}px) scale(${0.88 + menuIn * 0.12})`,
            transformOrigin: "bottom left",
            boxShadow: dark
              ? "inset 0 1px 0.5px rgba(255,255,255,0.14), 0 18px 50px rgba(0,0,0,0.55)"
              : "inset 0 1px 0.5px rgba(255,255,255,0.7), 0 18px 50px rgba(0,0,0,0.22)",
          }}
        >
          {MENU_ITEMS.map((item, i) => (
            <div
              key={item.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 13px",
                borderBottom:
                  i < MENU_ITEMS.length - 1
                    ? `0.5px solid ${rowDivider}`
                    : "none",
                background:
                  item.key === "photos" && photosTapped
                    ? dark
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(0,0,0,0.06)"
                    : "transparent",
              }}
            >
              <MenuIcon kind={item.key} />
              <span
                style={{
                  fontSize: 16,
                  color: labelColor,
                  letterSpacing: "-0.01em",
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
