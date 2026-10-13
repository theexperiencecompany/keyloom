// iOS 26 tapback, ported from GAIA's web MessageReactions badge
// (apps/web/src/features/chat/components/bubbles/MessageReactions.tsx +
// constants/reactionBadge.ts, gaia PR #1355): a 34pt badge on the bubble's top
// leading corner (top-trailing for a received bubble), a page-coloured 2pt ring
// cutting it out of the bubble, a two-dot tail pointing back into the bubble,
// and a 15pt glyph. Entrance: scale from 0.4 about the tail-side bottom corner.
import { Emoji } from "./Emoji";
import { IOS26_BLUE } from "./look";

/** The web badge's figma geometry is drawn 102 units tall for a 34px badge. */
const BADGE = 34;
const FIGMA_TO_PT = BADGE / 102;
const RING = 2;
const EMOJI = Math.round(46 * FIGMA_TO_PT);
const OVERHANG_TOP = 26;
const OVERHANG_SIDE = 22;
const ENTER_SCALE = 0.4;

/** Lobe fused to the circle, then a free dot; edge is measured from the badge's tail-side edge. */
const TAIL = [
  { size: 30 * FIGMA_TO_PT, edge: -1.5 * FIGMA_TO_PT, top: 73.5 * FIGMA_TO_PT },
  {
    size: 16 * FIGMA_TO_PT,
    edge: -14.5 * FIGMA_TO_PT,
    top: 98.5 * FIGMA_TO_PT,
  },
];

/** GAIA's reaction keeps the web badge's zinc-700 (PR #1355); the user's own is iMessage blue. */
const FILL = { gaia: "#3F3F46", user: IOS26_BLUE } as const;
const PAGE_BG = "#FFFFFF";

/** How far the badge (with its ring) pokes above the bubble's top edge, for reserving space. */
export const TAPBACK_IOS26_OVERHANG = OVERHANG_TOP + RING;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function TapbackIOS26({
  emoji,
  by,
  side,
  progress,
}: {
  emoji: string;
  by: "gaia" | "user";
  /** Side of the thread the *bubble* is on: left = received, right = sent. */
  side: "left" | "right";
  /** Overshooting pop spring (tapbackSpring). */
  progress: number;
}) {
  const fill = FILL[by];
  // The badge sits on the bubble's inner top corner; its tail points back toward the bubble.
  const tailSide = side === "right" ? "right" : "left";
  const anchorSide = side === "right" ? "left" : "right";
  return (
    <div
      style={{
        position: "absolute",
        top: -OVERHANG_TOP,
        [anchorSide]: -OVERHANG_SIDE,
        opacity: clamp01(progress),
        transform: `scale(${ENTER_SCALE + (1 - ENTER_SCALE) * Math.max(0, progress)})`,
        transformOrigin: `${tailSide} bottom`,
        zIndex: 2,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: BADGE,
          height: BADGE,
          borderRadius: BADGE / 2,
          background: fill,
          boxShadow: `0 0 0 ${RING}px ${PAGE_BG}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Emoji char={emoji} size={EMOJI} style={{ display: "block" }} />
      </div>
      {TAIL.map(({ size, edge, top }) => (
        <span
          key={top}
          style={{
            position: "absolute",
            width: size,
            height: size,
            top,
            [tailSide]: edge,
            borderRadius: "50%",
            background: fill,
          }}
        />
      ))}
    </div>
  );
}
