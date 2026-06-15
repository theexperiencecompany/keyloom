import { Audio } from "@remotion/media";
import { useEffect, useMemo, useState } from "react";
import {
  continueRender,
  delayRender,
  prefetch,
  Sequence,
  spring,
  staticFile,
  useVideoConfig,
} from "remotion";
import type { ChatMessage } from "../../editors/types";
import { DESIGN_FPS, useDesignFrame } from "../../use-design-frame";
import type { ChatMessageItem } from "../_chat-demo/ChatDemo";
import { ChatFill } from "../_chat-demo/ChatFill";
import { KEYBOARD_BG } from "../_chat-demo/Keyboard";
import { useSFProDisplay } from "../_chat-demo/sf-pro";
import { IMessageChat } from "./IMessageChat";

/** iMessage send/receive sound — played as each bubble lands. */
const MESSAGE_SFX = "sounds/message_bubble/message.mp3";
/** Short keyboard "tick" — played on every character typed on the keyboard.
 *  Drop a brief (~60–100ms) key-tap mp3 here. */
const KEY_SFX = "sounds/keyboard/key.mp3";

/**
 * Logical width (px) the whole chat is laid out at before being uniformly
 * scaled to fill the canvas (see ChatFill's `designWidth`). 402 ≈ an iPhone's
 * logical width; nudged slightly below that so bubbles/header read a touch
 * bigger than dead-natural without the "too big" overshoot of going much
 * smaller. Spacing/density is tuned via the thread gaps in IMessageChat, NOT by
 * changing this much further. `scale` is a fine zoom on top (1 = this fit).
 */
const PHONE_DESIGN_WIDTH = 384;

/**
 * Prefetch the SFX once into a cached (blob) source and block the render until
 * it's ready, then hand the SAME cached source to every cue. One decode, no
 * per-bubble network/load race — so the sound never silently fails to play and
 * never lags an export. Falls back to the static path if prefetch resolves with
 * no URL (or fails).
 */
/** Inline (uploaded data URL) or already-absolute sources bypass staticFile. */
function isInlineOrRemote(src: string): boolean {
  return /^(data:|blob:|https?:)/.test(src);
}

function useCachedSfx(path: string): string {
  const asset = useMemo(
    () => (isInlineOrRemote(path) ? path : staticFile(path)),
    [path],
  );
  const [handle] = useState(() => delayRender(`prefetch-sfx:${path}`));
  const [src, setSrc] = useState(asset);
  useEffect(() => {
    const { waitUntilDone } = prefetch(asset, { method: "blob-url" });
    waitUntilDone()
      .then((resolved: unknown) => {
        if (typeof resolved === "string" && resolved) setSrc(resolved);
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
    // Intentionally NOT calling free(): the cached blob must stay valid for the
    // whole render (every cue reuses it).
  }, [asset, handle]);
  return src;
}

/**
 * One per-bubble custom sound cue. Each instance owns its own prefetch (via
 * useCachedSfx) so distinct sounds are cached independently — distinct from the
 * two shared, top-level cues (message swoosh + keyboard tap). Plays at `from`,
 * layered on top of the default swoosh for that bubble.
 */
const CachedSfxSequence: React.FC<{
  path: string;
  from: number;
  volume: number;
}> = ({ path, from, volume }) => {
  const src = useCachedSfx(path);
  return (
    <Sequence from={from} name="custom-sfx" layout="none">
      <Audio src={src} volume={volume} />
    </Sequence>
  );
};

export type MessageBubblesProps = {
  contactName: string;
  contactAvatar?: string;
  /** Unread count shown as a pill beside the back chevron. 0 hides it. */
  unreadCount?: number;
  messages: ChatMessage[];
  orientation?: "landscape" | "portrait";
  scale?: number;
  /** Custom wallpaper behind the conversation (static path or http URL). */
  backgroundImage?: string;
  /** Light or dark iMessage appearance (uses Apple's exact bubble grays). */
  theme?: "light" | "dark";
  /** Show the on-screen keyboard typing out outgoing messages in real time. */
  showKeyboard?: boolean;
  /**
   * Extra photos shown in the attachment-picker gallery alongside the one being
   * sent (which is always the first tile). Up to 5; any empty slots fall back to
   * gradient placeholders. Each is `{ name, url }` (static path or http URL).
   */
  galleryImages?: { name: string; url: string }[];
};

/** Pop balloon hold + rise timings (frames) for the keyboard key press. */
const POP_HOLD = 7;
const POP_RISE = 2;

type ChatState = {
  items: ChatMessageItem[];
  composerText: string;
  pressedKey: string | null;
  pressT: number;
  /** When an outgoing PHOTO is being "sent" via the iMessage attachment picker
   *  (keyboard on), this drives the + → menu → Photos → grid → tap animation in
   *  place of the keyboard. Null the rest of the time. */
  attachment: { image: string; t: number } | null;
};

/**
 * Drive the whole conversation off the current frame. Without the keyboard
 * this is the classic behaviour (every message shows a typing-dots bubble then
 * its text). With the keyboard on, OUTGOING messages are instead "typed": their
 * text fills the composer character-by-character (popping the matching key),
 * and only once finished does the bubble send into the thread. Incoming
 * messages are unchanged — that's the other person typing.
 */
function buildChatState(
  messages: ChatMessage[],
  frame: number,
  keyboardOn: boolean,
): ChatState {
  const items: ChatMessageItem[] = [];
  let composerText = "";
  let pressedKey: string | null = null;
  let pressT = 0;
  let attachment: { image: string; t: number } | null = null;

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]!;
    // Never render an empty bubble — a message with no text and no image is
    // dropped from the video entirely.
    if (!m.image && !m.text.trim()) continue;
    // History: already on screen from the start — settled, no typing/pop-in,
    // never keyboard-typed. Skips all the timing logic below.
    if (m.history) {
      items.push({
        id: i,
        from: m.side === "right" ? "me" : "them",
        text: m.text,
        image: m.image,
        time: m.time,
        typing: false,
        enterFrames: 999,
      });
      continue;
    }
    if (frame < m.delay) continue;
    const local = frame - m.delay;
    const isOutgoing = m.side === "right";
    const inTyping = local < m.typingFrames;

    // Outgoing PHOTO with the keyboard on → play the attachment-picker flow in
    // place of typing (+ → menu → Photos → grid → tap). The bubble isn't in the
    // thread during the flow; it lands once the flow (typingFrames window) ends.
    if (keyboardOn && isOutgoing && m.image) {
      if (inTyping) {
        attachment = {
          image: m.image,
          t: Math.min(1, m.typingFrames > 0 ? local / m.typingFrames : 1),
        };
        continue;
      }
      items.push({
        id: i,
        from: "me",
        text: m.text,
        image: m.image,
        time: m.time,
        typing: false,
        enterFrames: local - m.typingFrames,
      });
      continue;
    }

    // Images can't be "typed" on the keyboard — they always send as a bubble.
    if (keyboardOn && isOutgoing && !m.image) {
      if (inTyping) {
        // Being typed on the keyboard → lives in the composer, not the thread.
        const chars = Array.from(m.text);
        const len = chars.length || 1;
        const typed = Math.max(
          0,
          Math.min(len, Math.floor((local / m.typingFrames) * len)),
        );
        composerText = chars.slice(0, typed).join("");

        // Active key = the most-recently-registered character still inside its
        // pop window. Each char j "presses" at the midpoint of its time slice.
        let bestJ = -1;
        let bestT = -Infinity;
        for (let j = 0; j < len; j++) {
          const tj = m.delay + ((j + 0.5) / len) * m.typingFrames;
          if (tj <= frame && tj > bestT) {
            bestT = tj;
            bestJ = j;
          }
        }
        if (bestJ >= 0) {
          const elapsed = frame - bestT;
          if (elapsed < POP_HOLD) {
            pressedKey = chars[bestJ]!.toLowerCase();
            pressT = elapsed < POP_RISE ? elapsed / POP_RISE : 1;
          }
        }
        continue;
      }
      items.push({
        id: i,
        from: "me",
        text: m.text,
        image: m.image,
        time: m.time,
        typing: false,
        enterFrames: local - m.typingFrames,
      });
      continue;
    }

    items.push({
      id: i,
      from: isOutgoing ? "me" : "them",
      text: m.text,
      image: m.image,
      time: m.time,
      typing: inTyping,
      enterFrames: local,
      // Drives the dots → message morph (bubble inflates from the tail and the
      // row height grows). Only meaningful when a typing phase actually ran.
      revealFrames:
        !inTyping && m.typingFrames > 0 ? local - m.typingFrames : undefined,
    });
  }

  return { items, composerText, pressedKey, pressT, attachment };
}

export const MessageBubbles: React.FC<MessageBubblesProps> = ({
  contactName,
  contactAvatar = "🤠",
  unreadCount = 12,
  messages,
  orientation = "landscape",
  scale = 2,
  backgroundImage,
  theme = "dark",
  showKeyboard = false,
  galleryImages,
}) => {
  // Load Apple's SF Pro Display so the chat renders in the real iMessage font
  // in headless exports too (blocks the render until decoded; never fails it).
  useSFProDisplay();
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();

  // Read receipt uses the REAL current time (computed once) — no editor field.
  const readReceiptTime = useMemo(() => {
    const d = new Date();
    let h = d.getHours();
    const min = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${String(min).padStart(2, "0")} ${ampm}`;
  }, []);

  // One soft "swoosh" per message, fired the frame each bubble lands (after its
  // typing phase). Messages are spaced well apart, so the cues never overlap —
  // each plays cleanly start-to-finish.
  const sfxCues = useMemo(
    () =>
      messages
        // History bubbles are already on screen — they never "land", so no SFX.
        .filter((m) => !m.history && (m.image || m.text.trim()))
        .map((m) => Math.max(0, Math.round(m.delay + m.typingFrames))),
    [messages],
  );

  // Per-bubble custom sound effects, fired at the same "land" frame as the
  // default swoosh. A bubble opts in via msg.sound (preset path or uploaded
  // data URL); history bubbles never land, so they're skipped.
  const customSfxCues = useMemo(
    () =>
      messages
        .filter(
          (m) => !m.history && (m.image || m.text.trim()) && m.sound?.trim(),
        )
        .map((m) => ({
          from: Math.max(0, Math.round(m.delay + m.typingFrames)),
          src: m.sound!.trim(),
        })),
    [messages],
  );
  const sfxSrc = useCachedSfx(MESSAGE_SFX);

  // A "tick" per character typed on the keyboard. Only outgoing TEXT messages
  // are typed on the keyboard (incoming show dots, photos run the picker,
  // history is already on screen) — and only when the keyboard is shown. Mirror
  // the per-char press timing buildChatState uses: char j fires at
  // delay + ((j + 0.5) / len) * typingFrames.
  const keyTapCues = useMemo(() => {
    if (!showKeyboard) return [];
    const cues: number[] = [];
    for (const m of messages) {
      if (m.history || m.image || m.side !== "right") continue;
      const chars = Array.from(m.text);
      const len = chars.length;
      if (len === 0 || (m.typingFrames ?? 0) <= 0) continue;
      for (let j = 0; j < len; j++) {
        if (chars[j] === " ") continue; // space bar is near-silent on iOS
        cues.push(
          Math.max(0, Math.round(m.delay + ((j + 0.5) / len) * m.typingFrames)),
        );
      }
    }
    return cues;
  }, [messages, showKeyboard]);
  const keySfxSrc = useCachedSfx(KEY_SFX);

  // All cue frames above are computed in DESIGN frames (60fps) — the same clock
  // `useDesignFrame()` animates on. Audio <Sequence from> wants ACTUAL render
  // frames, so when the project is exported at a non-60 fps the cues must be
  // rescaled or every sound drifts out of sync. At 60fps this is a no-op.
  const toRenderFrame = (designFrame: number) =>
    Math.round((designFrame * fps) / DESIGN_FPS);

  const { items, composerText, pressedKey, pressT, attachment } =
    buildChatState(messages, frame, showKeyboard);

  // Keyboard slides up at the very start, before the first message lands.
  const keyboardOpen = showKeyboard
    ? spring({
        frame,
        fps,
        config: { damping: 18, stiffness: 130, mass: 0.7 },
        durationInFrames: 18,
      })
    : 1;

  const backdrop = backgroundImage || theme === "dark" ? "#000000" : "#ffffff";

  return (
    <>
      {sfxCues.map((from, i) => (
        <Sequence
          key={`sfx-${i}`}
          from={toRenderFrame(from)}
          name="message-sfx"
        >
          <Audio src={sfxSrc} volume={0.8} />
        </Sequence>
      ))}
      {/* Per-bubble custom sound effects, layered on top of the swoosh. */}
      {customSfxCues.map((cue, i) => (
        <CachedSfxSequence
          key={`custom-sfx-${i}-${cue.from}`}
          path={cue.src}
          from={toRenderFrame(cue.from)}
          volume={1}
        />
      ))}
      {/* Keyboard "thwack" on every typed character — punchy, front and center. */}
      {keyTapCues.map((from, i) => (
        <Sequence key={`key-${i}`} from={toRenderFrame(from)} name="key-tap">
          <Audio src={keySfxSrc} volume={0.85} />
        </Sequence>
      ))}
      <ChatFill
        backdrop={backdrop}
        chromeColor={backdrop}
        bottomChromeColor={showKeyboard ? KEYBOARD_BG[theme] : undefined}
        scale={scale}
        designWidth={PHONE_DESIGN_WIDTH}
        orientation={orientation}
      >
        <IMessageChat
          title={contactName}
          headerAvatar={contactAvatar}
          unreadCount={unreadCount}
          messages={items}
          backgroundImage={backgroundImage}
          readReceiptTime={readReceiptTime}
          theme={theme}
          showKeyboard={showKeyboard}
          composerText={composerText}
          pressedKey={pressedKey}
          pressT={pressT}
          attachment={attachment}
          keyboardOpen={keyboardOpen}
          designWidth={PHONE_DESIGN_WIDTH}
          galleryImages={galleryImages}
        />
      </ChatFill>
    </>
  );
};
