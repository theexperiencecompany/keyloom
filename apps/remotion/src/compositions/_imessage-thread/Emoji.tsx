// Apple Color Emoji as images (160px iOS 18.4 PNGs from Emojipedia's Apple
// set, in public/emoji/<codepoints>.png). Linux has no Apple emoji font, so
// every emoji we render goes through here; an emoji without a PNG throws
// instead of silently falling back to Noto.
//
// To add emoji: `bun scripts/add-emoji.ts 🎉 ✈️` downloads the PNGs and registers them in
// AVAILABLE below.
import type React from "react";
import { Img } from "remotion";
import { threadAsset } from "./asset";

const AVAILABLE = new Set([
  "2b50", // ⭐
  "1f4b3", // 💳
  "2764-fe0f", // ❤️
  "1f44d", // 👍
  "1f629", // 😩
  "1f440", // 👀
  "1f605", // 😅
  "1f447", // 👇
  "1f64c", // 🙌
  "1f602", // 😂
  "1f525", // 🔥
  "1f389", // 🎉
  "2708-fe0f", // ✈️
  "2705", // ✅
  "203c-fe0f", // ‼️
]);

const codepoints = (s: string) =>
  Array.from(s)
    .map((c) => c.codePointAt(0)!.toString(16))
    .join("-");

/** Resolve an emoji grapheme to its PNG path, tolerating a missing/extra VS16. */
export function emojiSrc(char: string): string {
  const cp = codepoints(char);
  const candidates = [cp, cp.replace(/-fe0f/g, ""), `${cp}-fe0f`];
  for (const c of candidates)
    if (AVAILABLE.has(c)) return threadAsset(`emoji/${c}.png`);
  throw new Error(
    `No Apple emoji PNG for "${char}" (${cp}). Run: bun scripts/add-emoji.ts ${char}`,
  );
}

// Emoji-presentation graphemes only (plain ©, ™, ↔ stay text, like iOS).
const EMOJI_RE =
  /\p{Emoji_Presentation}|\uFE0F|\p{Emoji_Modifier}|\p{Regional_Indicator}/u;
export const isEmoji = (g: string) => EMOJI_RE.test(g);

/** A single Apple emoji image, `size` px square. */
export function Emoji({
  char,
  size,
  style,
}: {
  char: string;
  size: number;
  style?: React.CSSProperties;
}) {
  return (
    <Img
      src={emojiSrc(char)}
      alt={char}
      style={{ width: size, height: size, display: "inline-block", ...style }}
    />
  );
}

// Measured on Apple's iOS 18 Messages renders (17pt body): the emoji art is
// ~1.17em square and hangs ~0.235em below the baseline, so the face sits
// centred a little above the x-height, like Apple Color Emoji does.
const EMOJI_EM = 1.17;
const EMOJI_DROP_EM = 0.235;

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("en", { granularity: "grapheme" })
    : null;

function graphemes(text: string): string[] {
  if (segmenter) return Array.from(segmenter.segment(text), (s) => s.segment);
  return Array.from(text);
}

/**
 * Renders `text` inline, swapping every emoji for an Apple emoji image sized
 * and baseline-aligned to the surrounding font size (use inside a 17pt bubble).
 */
export function EmojiText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let run = "";
  graphemes(text).forEach((g, i) => {
    if (isEmoji(g)) {
      if (run) parts.push(run);
      run = "";
      parts.push(
        <Img
          key={i}
          src={emojiSrc(g)}
          alt={g}
          style={{
            width: `${EMOJI_EM}em`,
            height: `${EMOJI_EM}em`,
            verticalAlign: `-${EMOJI_DROP_EM}em`,
            display: "inline-block",
            margin: "0 0.02em",
          }}
        />,
      );
    } else run += g;
  });
  if (run) parts.push(run);
  return <>{parts}</>;
}
