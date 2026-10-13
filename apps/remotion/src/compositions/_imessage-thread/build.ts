import type { Sender, ThreadItem } from "./types";

// Times derive from reading length; a beat inherits the previous beat's clock time.
// A "Today 3:10 PM" stamp shows only after a gap of STAMP_GAP_MIN minutes or more.

// `chain`: lands right after the previous message as one burst (no typing dots, no read pause).
type Base = { id: string; time?: string; chain?: boolean };
export type Beat =
  | (Base & { from: Sender; text: string; think?: number })
  | (Base & { images: string[]; hold: number })
  | (Base & {
      link: { url: string; title: string; domain: string; image?: string };
      hold: number;
    })
  | (Base & { tap: string; hold: number })
  | (Base & { react: string; by: Sender; emoji: string; afterRead?: boolean });

// Pacing (seconds).
const TYPING = 0.35; // GAIA's typing bubble before each message
const BROWSER_TYPING = 1.1; // longer while GAIA is off using the browser
const USER_LEAD = 0.15; // pause before the user starts typing
export const SEND_PAUSE = 0.25; // typed text sits in the box before send
const READ_BASE = 0.3;
const READ_PER_WORD = 0.085;
const STAMP_LEAD = 0.35; // a new timestamp shows alone for a beat before the message starts
const REACTION_DELAY = 0.6; // after the target message lands
const REACTION_HOLD = 0.45;
const START = 0.4;
const CHAIN_GAP = 0.2;
const END_HOLD = 1.5;
const STAMP_GAP_MIN = 60;

const typeTime = (s: string) =>
  Math.min(1.3, Math.max(0.4, Array.from(s).length / 70));
const words = (s: string) => s.trim().split(/\s+/).length;

// "3:10 PM" -> minutes since midnight
function minutes(time: string) {
  const [, h, m, ap] = time.match(/^(\d+):(\d+) (AM|PM)$/) as RegExpMatchArray;
  return ((+h % 12) + (ap === "PM" ? 12 : 0)) * 60 + +m;
}

export type BuiltThread = {
  items: ThreadItem[];
  clock: { at: number; time: string }[];
  /** Seconds until the last beat has been read, plus the end hold. */
  end: number;
  /** When the most recent image stack lands. */
  imagesAt: number;
};

export function buildThread(beats: Beat[]): BuiltThread {
  const items: ThreadItem[] = [];
  const clock: { at: number; time: string }[] = [];
  const landedAt: Record<string, number> = {};
  let t = START;
  let lastAt = START;
  let imagesAt = 0;
  let time = "";
  let lastMin = -Infinity;

  // Called at the moment a beat starts on screen (typing dots or user typing).
  const begin = (b: Beat) => {
    if (b.time && b.time !== time) {
      const min = minutes(b.time);
      if (min - lastMin >= STAMP_GAP_MIN) {
        const [hm, ap] = b.time.split(" ");
        items.push({
          id: `stamp-${b.id}`,
          kind: "divider",
          at: t,
          day: "Today",
          time: `${hm} ${ap}`,
        });
        clock.push({ at: t, time: hm });
        t += STAMP_LEAD;
      } else {
        clock.push({ at: t, time: b.time.split(" ")[0] });
      }
      time = b.time;
      lastMin = min;
    }
  };

  for (const b of beats) {
    if ("react" in b) {
      // afterRead: the reaction answers the message, so it comes once it's been read.
      const at = Math.max(
        landedAt[b.react] + REACTION_DELAY,
        b.afterRead ? t : 0,
      );
      items.push({
        id: b.id,
        kind: "reaction",
        at,
        target: b.react,
        by: b.by,
        emoji: b.emoji,
      });
      t = Math.max(t, at + REACTION_HOLD);
    } else if ("tap" in b) {
      const at = t;
      const target = items.find((i) => i.id === b.tap);
      if (target?.kind === "link") target.tapAt = at;
      t = at + b.hold;
    } else if ("text" in b) {
      begin(b);
      const compose =
        b.from === "user" && !b.chain ? typeTime(b.text) : undefined;
      const typing =
        b.from === "gaia" && !b.chain ? (b.think ?? TYPING) : undefined;
      const lead = typing ?? USER_LEAD + (compose ?? 0) + SEND_PAUSE;
      const at = b.chain ? lastAt + CHAIN_GAP : t + lead;
      items.push({
        id: b.id,
        kind: "text",
        at,
        from: b.from,
        text: b.text,
        typing,
        compose,
      });
      landedAt[b.id] = lastAt = at;
      t = at + READ_BASE + READ_PER_WORD * words(b.text);
    } else if ("images" in b) {
      // Typing dots start with the request; the clock ticks as the photos land.
      const at = b.chain ? lastAt + CHAIN_GAP : t + BROWSER_TYPING;
      items.push({
        id: b.id,
        kind: "images",
        at,
        from: "gaia",
        srcs: b.images,
        typing: b.chain ? undefined : BROWSER_TYPING,
      });
      if (b.time) {
        clock.push({ at, time: b.time.split(" ")[0] });
        time = b.time;
        lastMin = minutes(b.time);
      }
      landedAt[b.id] = imagesAt = lastAt = at;
      t = at + b.hold;
    } else {
      begin(b);
      const at = b.chain ? lastAt + CHAIN_GAP : t + 0.4;
      items.push({ id: b.id, kind: "link", at, from: "gaia", ...b.link });
      landedAt[b.id] = lastAt = at;
      t = at + b.hold;
    }
  }
  return { items, clock, end: t + END_HOLD, imagesAt };
}
