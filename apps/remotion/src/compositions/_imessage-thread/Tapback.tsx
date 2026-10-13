// iOS 18 emoji tapback, measured off Apple's own iOS 18 Messages renders
// (newsroom "Apple-iOS-18-Messages-Tapbacks", support guide iph018d3c336) at
// 1.766 px/pt:
//   badge      34pt circle, flat fill, 1.5pt ring in the thread background
//              colour where it overlaps the bubble
//   anchor     received (left) bubble: centre 3pt in from the bubble's right
//              edge; sent (right) bubble: 3pt in from its left edge.
//              Centre sits 7pt above the bubble's top edge (Apple's two
//              examples: 5pt and 10pt), so the badge overlaps the corner by ~10pt.
//   tail       two circles running diagonally down and OUTWARD (away from the
//              bubble): 9.5pt at (±10.5, +16) from the badge centre, touching
//              the badge; 4.5pt at (±17.5, +23).
//   colour     viewer's own reaction: iMessage blue; the other party's: #E9E9EB
//   emoji      ~20pt Apple emoji, centred
import type React from "react";
import { interpolate, spring } from "remotion";
import { Emoji } from "./Emoji";
import { RECEIVED_GREY } from "./look";

const BLUE = "#0A7CFF"; // same as SENT_BLUE in Bubble.tsx

const D = 34; // badge diameter
const RING = 1.5;
const INSET_X = -5; // badge centre, relative to the bubble edge (negative = outside), so it never covers text
const RISE_Y = 11; // badge centre, above the bubble top
const TAIL_BIG = { d: 9.5, dx: 10.5, dy: 16 };
const TAIL_SMALL = { d: 4.5, dx: 17.5, dy: 23 };
const EMOJI = 20;

/** Spring with the iOS tapback feel: quick pop, ~8% overshoot, settles in ~0.45s. */
export function tapbackSpring(frame: number, fps: number, delay = 0): number {
  return spring({
    frame: frame - delay,
    fps,
    config: { damping: 11, stiffness: 260, mass: 0.7 },
  });
}

/** How far the badge pokes above the bubble's top edge (for reserving space). */
export const TAPBACK_OVERHANG = RISE_Y + D / 2 + RING;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function Tapback({
  emoji,
  by,
  side,
  progress,
  tailProgress = progress,
  ringColor = "#FFFFFF",
}: {
  emoji: string;
  by: "gaia" | "user";
  /** Side of the thread the *bubble* is on: left = received, right = sent. */
  side: "left" | "right";
  progress: number;
  /** Non-overshooting progress for the tail circles, so they settle instead of wobbling with the badge. */
  tailProgress?: number;
  /** Thread background behind the badge. */
  ringColor?: string;
}) {
  const fill = by === "user" ? BLUE : RECEIVED_GREY;
  // Tails point away from the bubble: right for a received bubble, left for sent.
  const dir = side === "left" ? 1 : -1;

  // Badge pops first; the tail circles follow a beat later, emoji lands last.
  const pBadge = Math.max(0, progress);
  const pBig = clamp01((tailProgress - 0.25) / 0.6);
  const pSmall = clamp01((tailProgress - 0.45) / 0.55);
  const pEmoji = interpolate(progress, [0.1, 1, 1.2], [0, 1, 1.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "extend",
  });

  const circle = (
    d: number,
    cx: number,
    cy: number,
    scale: number,
    color: string,
    extra = 0,
  ): React.CSSProperties => ({
    position: "absolute",
    width: d + extra * 2,
    height: d + extra * 2,
    left: cx - d / 2 - extra,
    top: cy - d / 2 - extra,
    borderRadius: "50%",
    background: color,
    transform: `scale(${scale})`,
  });

  // Local coords: (0,0) = badge centre.
  const shapes = (color: string, extra: number) => (
    <>
      <div
        style={circle(
          TAIL_SMALL.d,
          dir * TAIL_SMALL.dx,
          TAIL_SMALL.dy,
          pSmall,
          color,
          extra,
        )}
      />
      <div
        style={circle(
          TAIL_BIG.d,
          dir * TAIL_BIG.dx,
          TAIL_BIG.dy,
          pBig,
          color,
          extra,
        )}
      />
      <div style={circle(D, 0, 0, pBadge, color, extra)} />
    </>
  );

  return (
    <div
      style={{
        position: "absolute",
        top: -RISE_Y,
        [side === "left" ? "right" : "left"]: INSET_X,
        width: 0,
        height: 0,
        opacity: clamp01(progress * 4),
        zIndex: 2,
        pointerEvents: "none",
      }}
    >
      {/* background-coloured ring: the same silhouette, grown by RING */}
      {shapes(ringColor, RING)}
      {shapes(fill, 0)}
      <div
        style={{
          position: "absolute",
          left: -EMOJI / 2,
          top: -EMOJI / 2,
          width: EMOJI,
          height: EMOJI,
          transform: `scale(${pEmoji})`,
        }}
      >
        <Emoji char={emoji} size={EMOJI} style={{ display: "block" }} />
      </div>
    </div>
  );
}
