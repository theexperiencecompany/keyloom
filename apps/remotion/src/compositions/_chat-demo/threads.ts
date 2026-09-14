import type { ChatMessageItem } from "./types";

type CurvedThread = {
  from: "me" | "them";
  items: ChatMessageItem[];
};

export function curvedThread(messages: ChatMessageItem[]): CurvedThread[] {
  const out: CurvedThread[] = [];
  for (const m of messages) {
    const from = m.from ?? "them";
    const last = out[out.length - 1];
    if (last && last.from === from) last.items.push(m);
    else out.push({ from, items: [m] });
  }
  return out;
}

/* =========================================================================
 * iMessage
 * ========================================================================= */

// iMessage bubble palette.
//  • Sent — solid blue, white text.

export function pickColor(seed: string) {
  const palette = [
    "#5865F2",
    "#EB459E",
    "#F23F42",
    "#23A55A",
    "#F0B232",
    "#FF7C5C",
    "#9B7CFF",
    "#1ABC9C",
    "#3498DB",
    "#E74C3C",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++)
    hash = (hash << 5) - hash + seed.charCodeAt(i);
  return palette[Math.abs(hash) % palette.length];
}

type AuthorGroup = {
  author?: { name: string; avatar?: string; color?: string };
  items: ChatMessageItem[];
};

export function groupByAuthor(messages: ChatMessageItem[]): AuthorGroup[] {
  const out: AuthorGroup[] = [];
  for (const m of messages) {
    const last = out[out.length - 1];
    if (last && last.author?.name === m.author) {
      last.items.push(m);
    } else {
      out.push({
        author: {
          name: m.author ?? "Unknown",
          avatar: m.avatar,
          color: m.authorColor,
        },
        items: [m],
      });
    }
  }
  return out;
}
