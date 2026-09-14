"use client";

import { ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useId, useLayoutEffect, useRef, useState } from "react";
import {
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { asset } from "../../lib/asset";
import { clamp01, lerp } from "../../lib/math";
import { useDesignFrame } from "../../use-design-frame";

/**
 * Tile a doodle PNG across an absolute-positioned region. Replaces CSS
 * `background-image: url(...) repeat` which @remotion/web-renderer's
 * canvas-walk fallback silently drops in browser exports — we render real
 * `<Img>` tiles instead so the renderer's `drawImage` path picks them up.
 */
export function DoodleTiles({
  src,
  tileW,
  tileH,
  cols,
  rows,
}: {
  src: string;
  tileW: number;
  tileH: number;
  cols: number;
  rows: number;
}) {
  const tiles: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push(
        <Img
          key={`${r}-${c}`}
          src={src}
          crossOrigin="anonymous"
          alt=""
          style={{
            position: "absolute",
            left: c * tileW,
            top: r * tileH,
            width: tileW,
            height: tileH,
            pointerEvents: "none",
          }}
        />,
      );
    }
  }
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {tiles}
    </div>
  );
}

export function BubbleEnter({
  enterFrames,
  from,
  children,
  slideUp = false,
}: {
  enterFrames?: number;
  from?: "me" | "them";
  children: React.ReactNode;
  /**
   * Slide the bubble UP into place (translateY) instead of the default
   * scale-from-tail inflate. Used for sent PHOTO bubbles, which read better
   * rising into the thread than ballooning from a corner.
   */
  slideUp?: boolean;
}) {
  const frame = Math.max(0, enterFrames ?? 9999);
  // iMessage bubbles inflate from their tail corner (bottom-right for sent,
  // bottom-left for received) with a quick fade — no vertical slide. An eased
  // grow (NOT a spring) so it settles cleanly with zero overshoot/bounce.
  const s = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const scale = 0.5 + 0.5 * s;
  const opacity = Math.min(1, s * 2.2);
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        justifyContent: from === "me" ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          transform: slideUp
            ? `translateY(${(1 - s) * 44}px)`
            : `scale(${scale})`,
          transformOrigin: from === "me" ? "bottom right" : "bottom left",
          opacity,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Approximate rendered height of the typing-dots bubble (line box + padding).
// Used as the starting height for the dots → message morph.
const TYPING_BUBBLE_H = 32;

/**
 * iMessage dots → message morph. The WHOLE message bubble — surface and text
 * together, already at its final size — scales up from the tail corner while
 * fading in, exactly like the real swap (mid-transition you see a smaller,
 * dimmer bubble with the text inside it). In sync, the row's layout height
 * glides from the dots pill to the message's measured natural height so a
 * taller message pushes the thread up smoothly. One motion, no bounce.
 *
 * Natural height is measured from the live DOM (same pattern as the
 * keyboard/glass measurement); until known the row renders at natural size,
 * which lasts a frame and is imperceptible.
 */
export function BubbleReveal({
  revealFrames,
  from,
  children,
}: {
  /** Frames since the dots swapped to the message; undefined = no morph. */
  revealFrames?: number;
  from?: "me" | "them";
  children: React.ReactNode;
}) {
  const { fps } = useVideoConfig();
  const innerRef = useRef<HTMLDivElement>(null);
  const [fullH, setFullH] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const h = el.offsetHeight;
    if (h > 0 && h !== fullH) setFullH(h);
  });

  if (revealFrames === undefined) return <>{children}</>;

  // Heavily damped spring — a clean, smooth settle with no visible overshoot.
  const s = spring({
    frame: Math.max(0, revealFrames),
    fps,
    config: { damping: 22, mass: 0.8, stiffness: 180 },
    durationInFrames: 16,
  });
  const scale = 0.35 + 0.65 * s;
  const opacity = Math.min(1, s * 1.8);
  // The bubble is scaled small while the row grows, so nothing ever overlaps
  // the messages above — no clipping needed.
  const height =
    fullH !== null
      ? TYPING_BUBBLE_H + (fullH - TYPING_BUBBLE_H) * Math.min(1, s)
      : undefined;

  return (
    <div
      style={{
        height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: from === "me" ? "flex-end" : "flex-start",
        overflow: "visible",
      }}
    >
      <div
        ref={innerRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: from === "me" ? "bottom right" : "bottom left",
          opacity,
          willChange: "transform, opacity",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * The iMessage typing indicator has its OWN bubble shape — a rounded blob with
 * a two-circle "puff" tail (a medium circle hugging the bottom corner + a
 * smaller detached one below it), NOT the hooked tail of a message bubble.
 * This renders that authentic shape. `bodyRef` measures only the rounded body
 * so the dots → message morph grows from the body's footprint while the puff
 * circles simply fade.
 */
export function TypingBubble({
  from,
  background,
  tailColor,
  color,
  dotsColor,
  bodyRef,
}: {
  from: "me" | "them";
  background: string;
  tailColor: string;
  color: string;
  dotsColor: string;
  bodyRef?: React.Ref<HTMLDivElement>;
}) {
  const isMe = from === "me";
  const side = isMe ? "right" : "left";
  const puff: React.CSSProperties = {
    position: "absolute",
    borderRadius: 9999,
    background,
  };
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* puff tail — two circles trailing off the bottom corner */}
      <span
        aria-hidden
        style={{ ...puff, bottom: -1, [side]: -3, width: 11, height: 11 }}
      />
      <span
        aria-hidden
        style={{ ...puff, bottom: -6, [side]: -7, width: 6, height: 6 }}
      />
      {/* The body is a real message bubble (just without the hooked tail), so
          its size/shape/radius/padding is IDENTICAL to the message it morphs
          into — a single-line reply needs no vertical distortion, only a
          width grow + dots→text crossfade. */}
      <div ref={bodyRef} style={{ display: "inline-block" }}>
        <CurvedBubble
          from={from}
          tail={false}
          background={background}
          tailColor={tailColor}
          color={color}
        >
          <TypingDots color={dotsColor} />
        </CurvedBubble>
      </div>
    </div>
  );
}

/**
 * Continuous iMessage typing-dots → message morph. Unlike a fade-out + pop-in,
 * the gray typing pill is never removed: the real message bubble grows out of
 * the exact footprint of the dots pill (anchored at the tail corner) while the
 * dots crossfade into the text. One unbroken bubble that swells into place,
 * exactly like iOS — no vanish, no scale-from-tiny pop.
 *
 * Both footprints are measured live. Remotion re-renders every frame, so the
 * measure → re-render happens within the SAME frame (useLayoutEffect commits
 * before paint): the text bubble is rendered in normal flow — so it wraps
 * against the same max width as a settled bubble — and the dots pill is the
 * same surface we fade out, measured from its own node.
 */
export function DotsToMessage({
  from,
  tail,
  background,
  tailColor,
  color,
  dotsColor,
  text,
  typing,
  revealFrames,
  topGrouped = false,
  bottomGrouped = false,
}: {
  from: "me" | "them";
  tail: boolean;
  background: string;
  tailColor: string;
  color: string;
  dotsColor: string;
  text?: string;
  typing: boolean;
  /** Frames since the dots swapped to the message; undefined = no morph. */
  revealFrames?: number;
  /** iMessage grouping — flatten the tail-side top/bottom corner when stacked
   *  against a same-sender bubble (see CurvedBubble). */
  topGrouped?: boolean;
  bottomGrouped?: boolean;
}) {
  const textRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const [textSize, setTextSize] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [dotsSize, setDotsSize] = useState<{ w: number; h: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    const t = textRef.current;
    if (t) {
      const w = t.offsetWidth;
      const h = t.offsetHeight;
      if (w > 0 && h > 0 && (!textSize || textSize.w !== w || textSize.h !== h))
        setTextSize({ w, h });
    }
    const d = dotsRef.current;
    if (d) {
      const w = d.offsetWidth;
      const h = d.offsetHeight;
      if (w > 0 && h > 0 && (!dotsSize || dotsSize.w !== w || dotsSize.h !== h))
        setDotsSize({ w, h });
    }
  });

  const isMe = from === "me";
  const originX = isMe ? "right" : "left";

  const dotsPill = (ref?: React.Ref<HTMLDivElement>) => (
    <TypingBubble
      from={from}
      background={background}
      tailColor={tailColor}
      color={color}
      dotsColor={dotsColor}
      bodyRef={ref}
    />
  );

  const textPill = (
    <CurvedBubble
      from={from}
      tail={tail}
      background={background}
      tailColor={tailColor}
      color={color}
      topGrouped={topGrouped}
      bottomGrouped={bottomGrouped}
    >
      {text}
    </CurvedBubble>
  );

  // Pure typing phase — just the pulsing pill (BubbleEnter pops it in).
  if (typing) return dotsPill(dotsRef);

  // Message arrived without ever showing dots — plain bubble; BubbleEnter
  // gives it the standard send/receive pop.
  if (revealFrames === undefined) return textPill;

  // A short eased grow — NO spring, so there's zero overshoot/bounce. The
  // message settles in ~9 frames.
  const s = interpolate(Math.max(0, revealFrames), [0, 9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Until both footprints are known (the first rendered frame of the morph),
  // keep the pill on screen and hold the text invisible IN FLOW so it measures
  // against the real wrap width. Same-frame re-render → no visible flash.
  if (textSize === null || dotsSize === null) {
    return (
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: isMe ? "flex-end" : "flex-start",
        }}
      >
        {dotsPill(dotsRef)}
        <div ref={textRef} style={{ opacity: 0, pointerEvents: "none" }}>
          {textPill}
        </div>
      </div>
    );
  }

  // Subtle UNIFORM inflate from the tail corner (bottom-left received /
  // bottom-right sent) — not a width stretch, which read as an elastic
  // left-to-right bounce. The row height glides from the pill to the message
  // so the thread pushes up smoothly, and the dots crossfade into the text.
  const sc = lerp(0.86, 1, s);
  const layoutH = lerp(dotsSize.h, textSize.h, s);
  const dotsOpacity = clamp01(1 - s / 0.4);
  const textOpacity = clamp01((s - 0.1) / 0.45);

  return (
    <div
      style={{
        position: "relative",
        height: layoutH,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: isMe ? "flex-end" : "flex-start",
        overflow: "visible",
      }}
    >
      {dotsOpacity > 0.01 && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            [originX]: 0,
            opacity: dotsOpacity,
            pointerEvents: "none",
            willChange: "opacity",
          }}
        >
          {dotsPill()}
        </div>
      )}
      <div
        ref={textRef}
        style={{
          transform: `scale(${sc})`,
          transformOrigin: `bottom ${originX}`,
          opacity: textOpacity,
          willChange: "transform, opacity",
        }}
      >
        {textPill}
      </div>
    </div>
  );
}

// iMessage read receipt — sits under the last outgoing bubble. It eases in
// once that bubble has landed ("Delivered"), then gently crossfades to
// "Read <time>" a beat later (the recipient "seeing" it): Delivered fades up
// and out while Read fades up from just below, so the swap is smooth instead
// of a hard text cut. `enterFrames` is frames-since-visible for that message,
// keeping the receipt in lockstep with the bubble's own timeline.
const RECEIPT_FADE_AT = 14;
const RECEIPT_READ_AT = 42;
const RECEIPT_READ_DUR = 16;

export function ReadReceipt({
  enterFrames,
  color,
  time,
}: {
  enterFrames: number;
  color: string;
  time?: string;
}) {
  // Smooth, clean settle — an eased fade with a whisper of scale and rise. No
  // spring/overshoot: iMessage's receipt eases into place, it doesn't bounce.
  const appear = interpolate(
    enterFrames,
    [RECEIPT_FADE_AT, RECEIPT_FADE_AT + 11],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );
  if (appear <= 0.001) return null;
  const appearScale = 0.94 + 0.06 * appear;
  const appearY = (1 - appear) * 3;
  // 0 → 1 as the message goes Delivered → Read, eased for a soft handoff.
  const readP = interpolate(
    enterFrames,
    [RECEIPT_READ_AT, RECEIPT_READ_AT + RECEIPT_READ_DUR],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );

  const layer: React.CSSProperties = {
    position: "absolute",
    right: 0,
    top: 0,
    whiteSpace: "nowrap",
    fontSize: 9.5,
    lineHeight: "11px",
    letterSpacing: "-0.01em",
    color,
    fontWeight: 400,
  };

  return (
    <div
      style={{
        position: "relative",
        height: 11,
        minWidth: 50,
        marginTop: 3,
        marginRight: 2,
        opacity: appear,
        // translate3d + willChange forces a GPU layer so the spring SCALE is
        // composited smoothly. Scaling text without this re-rasterizes the
        // glyphs every frame → the shimmer/jitter.
        transform: `translate3d(0, ${appearY}px, 0) scale(${appearScale})`,
        transformOrigin: "top right",
        willChange: "transform",
      }}
    >
      <div
        style={{
          ...layer,
          opacity: 1 - readP,
          transform: `translate3d(0, ${readP * -2}px, 0)`,
          willChange: "transform, opacity",
        }}
      >
        <span style={{ fontWeight: 600 }}>Delivered</span>
      </div>
      <div
        style={{
          ...layer,
          opacity: readP,
          transform: `translate3d(0, ${(1 - readP) * 2}px, 0)`,
          willChange: "transform, opacity",
        }}
      >
        <span style={{ fontWeight: 600 }}>Read</span>
        {time ? <span style={{ fontWeight: 600 }}> {time}</span> : null}
      </div>
    </div>
  );
}

/* =========================================================================
 * Shared curved bubble (the iMessage shape, reused by WhatsApp & Telegram)
 * ========================================================================= */

// iMessage tail: the outer edge sweeps from the bubble's bottom corner out to a
// SHARP point at the outer-bottom, then a concave hook curves back up to the
// bubble's side. The outer arc runs straight into the tip (no rounding) so the
// point stays crisp like the real thing.
const TAIL_THEM =
  "M 20 0 L 20 2 A 16 16 0 0 1 3.8 18 L 0.5 16.2 A 10 10 0 0 0 7 8 L 7 0 Z";
const TAIL_ME =
  "M 0 0 L 0 2 A 16 16 0 0 0 16.2 18 L 19.5 16.2 A 10 10 0 0 1 13 8 L 13 0 Z";

interface CurvedBubbleProps {
  from: "me" | "them";
  tail: boolean;
  background: string;
  tailColor: string;
  color: string;
  children: React.ReactNode;
  /** Inline meta (time / ticks) shown at bottom-right of the bubble */
  meta?: React.ReactNode;
  maxWidthPct?: number;
  /** iMessage grouping: this bubble has a same-sender bubble directly ABOVE it,
   *  so flatten its top corner on the tail side to stack flush. */
  topGrouped?: boolean;
  /** Same, but a same-sender bubble directly BELOW — flatten the bottom corner
   *  on the tail side. */
  bottomGrouped?: boolean;
}

// Corner radii: full rounded corner vs the small "grouped" corner used where
// consecutive same-sender bubbles stack against each other (the iMessage pillar
// look). Only the tail side flattens; the opposite side stays fully rounded.
const BUBBLE_R = 18;
const BUBBLE_R_GROUPED = 6;

export function CurvedBubble({
  from,
  tail,
  background,
  tailColor,
  color,
  children,
  meta,
  maxWidthPct = 100,
  topGrouped = false,
  bottomGrouped = false,
}: CurvedBubbleProps) {
  const isMe = from === "me";
  const topTail = topGrouped ? BUBBLE_R_GROUPED : BUBBLE_R;
  const botTail = bottomGrouped ? BUBBLE_R_GROUPED : BUBBLE_R;
  // Flatten only the corners on the tail side (right for me, left for them).
  const groupedRadii: React.CSSProperties = isMe
    ? {
        borderTopRightRadius: topTail,
        borderBottomRightRadius: botTail,
      }
    : {
        borderTopLeftRadius: topTail,
        borderBottomLeftRadius: botTail,
      };
  const innerStyle: React.CSSProperties = {
    color,
    padding: "5px 13px 6px",
    borderRadius: 18,
    fontSize: 15.5,
    lineHeight: "20px",
    letterSpacing: "-0.01em",
    wordBreak: "break-word",
    position: "relative",
    whiteSpace: "pre-wrap",
  };
  const inner = (
    <>
      {children}
      {meta && (
        <span
          style={{
            display: "inline-block",
            verticalAlign: "bottom",
            marginLeft: 6,
            marginRight: -2,
            marginBottom: -1,
            fontSize: 11,
            lineHeight: "14px",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            opacity: 0.95,
          }}
        >
          {meta}
        </span>
      )}
    </>
  );

  return (
    <div className="relative" style={{ maxWidth: `${maxWidthPct}%` }}>
      <div style={{ ...innerStyle, ...groupedRadii, background }}>{inner}</div>
      {tail && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 0,
            [isMe ? "right" : "left"]: -7,
            width: 20,
            height: 18,
            background: tailColor,
            clipPath: `path('${isMe ? TAIL_ME : TAIL_THEM}')`,
          }}
        />
      )}
    </div>
  );
}

/**
 * Measure an image's natural aspect ratio (w / h). Blocks the render (via
 * delayRender) until the bitmap loads so `remotion render` waits for the real
 * dimensions instead of capturing a default-sized box. Returns null until known.

/**
 * Measure an image's natural aspect ratio (w / h). Blocks the render (via
 * delayRender) until the bitmap loads so `remotion render` waits for the real
 * dimensions instead of capturing a default-sized box. Returns null until known.
 */
export function useImageAspect(src: string | undefined): number | null {
  const [aspect, setAspect] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!src) {
      setAspect(null);
      return;
    }
    const handle = delayRender(`img-aspect:${src.slice(0, 48)}`);
    const img = new Image();
    img.crossOrigin = "anonymous";
    let done = false;
    const finish = (a: number) => {
      if (done) return;
      done = true;
      setAspect(a);
      continueRender(handle);
    };
    img.onload = () =>
      finish((img.naturalWidth || 1) / (img.naturalHeight || 1));
    img.onerror = () => finish(0.72);
    img.src = src;
    return () => {
      if (!done) {
        done = true;
        continueRender(handle);
      }
    };
  }, [src]);
  return aspect;
}

/**
 * iMessage photo bubble. The photo is masked into ONE continuous silhouette —
 * a rounded rectangle whose bottom corner extends into the curved tail — using
 * a single `clip-path` with two sub-paths (rounded body + tail) on a single
 * element. Doing it as one shape (instead of a rounded body div + a separate
 * tail) is what makes the tail actually read: the body's corner radius no
 * longer cuts away the spot the tail attaches to, so the photo flows straight
 * out into the wick. `drop-shadow` (not box-shadow) follows the clipped shape.
 */
export function ImageBubble({
  src,
  from,
  tail,
  watermark = false,
}: {
  src: string;
  from: "me" | "them";
  tail: boolean;
  /** Overlay a "Made with Halo AI" badge along the bottom of the photo. */
  watermark?: boolean;
}) {
  const isMe = from === "me";
  const resolved = asset(src) ?? src;
  const aspect = useImageAspect(resolved);

  const W = 210; // body width (design px)
  const overhang = 7; // how far the tail pokes past the body
  const r = 18; // body corner radius
  const boxW = W + (tail ? overhang : 0);
  const a = aspect ?? 0.72;
  const H = Math.round(Math.min(320, Math.max(130, boxW / a)));

  // Body sits flush to the tail side; the tail's overhang is the extra width.
  const bx = tail && !isMe ? overhang : 0;
  const ty = H - 18;

  const body = `M ${bx + r} 0 H ${bx + W - r} A ${r} ${r} 0 0 1 ${bx + W} ${r} V ${H - r} A ${r} ${r} 0 0 1 ${bx + W - r} ${H} H ${bx + r} A ${r} ${r} 0 0 1 ${bx} ${H - r} V ${r} A ${r} ${r} 0 0 1 ${bx + r} 0 Z`;

  // Tail sub-path, wound the SAME direction as the body so nonzero fill unions
  // them cleanly (no notch). Geometry mirrors the text-bubble tails.
  const tx = isMe ? bx + W - 13 : 0;
  const tailPath = isMe
    ? `M ${tx} ${ty} L ${tx} ${ty + 2} A 16 16 0 0 0 ${tx + 16} ${ty + 18} L ${tx + 20} ${ty + 18} L ${tx + 20} ${ty + 17.54} A 10 10 0 0 1 ${tx + 13} ${ty + 8} L ${tx + 13} ${ty} Z`
    : `M ${tx + 20} ${ty} L ${tx + 20} ${ty + 2} A 16 16 0 0 1 ${tx + 4} ${ty + 18} L ${tx} ${ty + 18} L ${tx} ${ty + 17.54} A 10 10 0 0 0 ${tx + 7} ${ty + 8} L ${tx + 7} ${ty} Z`;

  // Union the body + tail via an SVG <clipPath>: SVG clip children always union
  // (no winding/fill-rule gotcha that left a white notch where the two shapes
  // overlapped with a CSS path()).
  const clipId = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  return (
    <div
      style={{
        width: boxW,
        display: "flex",
        flexDirection: "column",
        alignItems: isMe ? "flex-end" : "flex-start",
      }}
    >
      <svg
        width="0"
        height="0"
        aria-hidden="true"
        style={{ position: "absolute", width: 0, height: 0 }}
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d={body} />
            {tail && <path d={tailPath} />}
          </clipPath>
        </defs>
      </svg>
      <div
        style={{
          width: boxW,
          height: H,
          backgroundImage: `url('${resolved}')`,
          backgroundSize: `${boxW}px ${H}px`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "0 0",
          clipPath: `url(#${clipId})`,
          WebkitClipPath: `url(#${clipId})`,
          filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.22))",
        }}
      />
      {watermark && (
        // Caption row BELOW the photo, like "Made with Halo AI" on AI videos.
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            paddingLeft: bx + 2,
            paddingTop: 5,
            color: "#8e8e93",
          }}
        >
          <HugeiconsIcon icon={ViewOffSlashIcon} size={14} color="#8e8e93" />
          <span style={{ fontSize: 12, fontWeight: 400 }}>
            Made with Halo AI
          </span>
        </div>
      )}
    </div>
  );
}

export function TypingDots({ color }: { color: string }) {
  // Drive the dots from Remotion's frame clock, not CSS keyframes. CSS
  // animations run on the browser's wall clock, which is sampled at a
  // slightly different phase on every render frame during export — that's
  // what makes the dots look shaky and out-of-sync with the bubble's
  // spring-driven enter. snap()ing the translate to whole pixels also
  // eliminates the residual subpixel shimmer.
  const frame = useDesignFrame();
  const periodFrames = 60 * 1.4; // ~1.4s breathe cycle at design fps
  return (
    <span
      role="status"
      aria-label="typing"
      style={{
        // Sit in the bubble's normal line box so the typing body has the exact
        // same height as a one-line message bubble (the body IS a message
        // bubble) — the dots → text morph then has nothing to distort.
        display: "inline-flex",
        alignItems: "center",
        verticalAlign: "middle",
        gap: 4,
      }}
    >
      {[0, 1, 2].map((i) => {
        // Stagger each dot so the three read as a gentle wave.
        const staggered = frame - i * (periodFrames * 0.16);
        const t = ((staggered % periodFrames) + periodFrames) % periodFrames;
        const phase = t / periodFrames; // 0..1
        // iMessage dots PULSE — they fade and scale in place; they do NOT
        // bounce vertically (that's what made ours read as bouncy).
        const bump = Math.max(0, Math.sin(phase * Math.PI));
        const opacity = 0.45 + bump * 0.55;
        const scale = 0.74 + bump * 0.26;
        return (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 9999,
              background: color,
              opacity,
              transform: `scale(${scale})`,
              display: "inline-block",
            }}
          />
        );
      })}
    </span>
  );
}

/* ----- Shared composer icons (user-provided paths) ----- */
