import type { CaptionWord } from "../TikTokCaption/TikTokCaption";

export type TimeRange = { start: number; end: number };

const MIN_RANGE_SECONDS = 0.01;

export function normalizeCuts(
  cuts: TimeRange[],
  duration: number,
): TimeRange[] {
  const clamped = cuts
    .map((c) => ({
      start: Math.max(0, Math.min(c.start, c.end)),
      end: Math.min(duration, Math.max(c.start, c.end)),
    }))
    .filter((c) => c.end - c.start > MIN_RANGE_SECONDS)
    .sort((a, b) => a.start - b.start);

  const merged: TimeRange[] = [];
  for (const c of clamped) {
    const last = merged[merged.length - 1];
    if (last && c.start <= last.end + MIN_RANGE_SECONDS) {
      last.end = Math.max(last.end, c.end);
    } else {
      merged.push({ ...c });
    }
  }
  return merged;
}

export function buildKeeps(cuts: TimeRange[], duration: number): TimeRange[] {
  const keeps: TimeRange[] = [];
  let cursor = 0;
  for (const c of normalizeCuts(cuts, duration)) {
    if (c.start - cursor > MIN_RANGE_SECONDS) {
      keeps.push({ start: cursor, end: c.start });
    }
    cursor = Math.max(cursor, c.end);
  }
  if (duration - cursor > MIN_RANGE_SECONDS) {
    keeps.push({ start: cursor, end: duration });
  }
  return keeps;
}

/**
 * Re-times words from the original video timeline onto the edited (post-cut)
 * timeline. Words whose midpoint falls inside a cut are dropped; the rest are
 * shifted left by the removed time before them and clamped to their keep
 * range so a word never bleeds across a cut boundary.
 */
export function remapWords(
  words: CaptionWord[],
  keeps: TimeRange[],
): CaptionWord[] {
  const out: CaptionWord[] = [];
  let offset = 0;
  for (const k of keeps) {
    const len = k.end - k.start;
    for (const w of words) {
      const mid = (w.start + w.end) / 2;
      if (mid < k.start || mid > k.end) continue;
      const start = offset + Math.max(0, w.start - k.start);
      const end = offset + Math.min(len, w.end - k.start);
      if (end - start > 0.001) out.push({ ...w, start, end });
    }
    offset += len;
  }
  return out;
}
