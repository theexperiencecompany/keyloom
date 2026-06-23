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
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import type { ChatMessage } from "../../editors/types";
import { SmartAudio } from "../../smart-audio";
import { DESIGN_FPS, useDesignFrame } from "../../use-design-frame";
import {
  type ChatMessageItem,
  IMESSAGE_GRADIENT,
} from "../_chat-demo/ChatDemo";
import { ChatFill } from "../_chat-demo/ChatFill";
import { KEYBOARD_BG } from "../_chat-demo/Keyboard";
import { useSFProDisplay } from "../_chat-demo/sf-pro";
import { IMessageChat } from "./IMessageChat";

/** iMessage send/receive sound — played as each bubble lands. */
const MESSAGE_SFX = "sounds/message_bubble/message.mp3";

/** Soft mechanical keyboard tap — played once per typed character while the
 *  on-screen keyboard is shown. */
const KEY_SFX = "sounds/keyboard/key.mp3";

/** Hard cap on per-keystroke tap cues so a very long script can't mount an
 *  unbounded number of <Audio> tags (the reason per-keystroke audio was once
 *  pulled entirely). Generous — enough for several full messages. */
const MAX_KEY_TAPS = 400;

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
  durationInFrames: number;
  volume: number;
}> = ({ path, from, durationInFrames, volume }) => {
  const src = useCachedSfx(path);
  return (
    <Sequence
      from={from}
      durationInFrames={durationInFrames}
      name="custom-sfx"
      layout="none"
    >
      <SmartAudio src={src} volume={volume} />
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
  /** Overlay a "Made with Halo AI" badge on outgoing photo bubbles. */
  showImageWatermark?: boolean;
  /** Universal Style — sheet background, received text, font, sent accent. */
  clipStyle?: ClipStyle;
};

/** Pop balloon hold + rise timings (frames) for the keyboard key press. */
const POP_HOLD = 7;
const POP_RISE = 2;

/**
 * Human-ish keyboard typing. The TEMPO stays uniform (every keystroke costs the
 * same — no per-key speed jitter, which read as laggy), but every so often a
 * word gets a real typo: a wrong neighbouring key is tapped, there's a beat to
 * "notice" it, a backspace deletes it, and the correct key is retyped. That's
 * what makes it feel like a person typing instead of a perfect machine.
 *
 * Returns a keystroke timeline: each event carries the composer text AFTER that
 * keystroke and the key that caused it (for the on-screen key pop; `null` for a
 * space, `"backspace"` for a delete). `at` is the design-frame offset within
 * the message's typing window, normalised so the message finishes exactly as
 * its window ends — so send timing (and the swoosh) is unchanged.
 *
 * Deterministic: all randomness is seeded off the message text, so a clip
 * renders identically every time (Remotion requires stable frames).
 */
type KeyEvent = { at: number; text: string; key: string | null };

/** mulberry32 seeded from a string — cheap, deterministic. */
function makeRng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** QWERTY left/right neighbour of a letter — a plausible fat-finger mistype. */
const KEY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
function neighborKey(c: string, rng: () => number): string {
  const lower = c.toLowerCase();
  for (const row of KEY_ROWS) {
    const idx = row.indexOf(lower);
    if (idx === -1) continue;
    const opts: string[] = [];
    if (idx > 0) opts.push(row[idx - 1]!);
    if (idx < row.length - 1) opts.push(row[idx + 1]!);
    if (opts.length) return opts[Math.floor(rng() * opts.length)]!;
  }
  return lower;
}

const typingCache = new Map<string, KeyEvent[]>();

function buildTyping(text: string, typingFrames: number): KeyEvent[] {
  const cacheKey = `${typingFrames}|${text}`;
  const cached = typingCache.get(cacheKey);
  if (cached) return cached;

  const chars = Array.from(text);
  const rng = makeRng(text);
  // Build in abstract "cost" units (≈ one keystroke each), then scale to fit
  // typingFrames so typos never make a message overrun its window.
  const raw: { cost: number; text: string; key: string | null }[] = [];
  let shown = "";

  for (let j = 0; j < chars.length; j++) {
    const c = chars[j]!;
    const isLetter = /[a-z]/i.test(c);
    // Occasional typo mid-word (~7% of letters): wrong key → notice → fix.
    if (isLetter && shown.length > 0 && rng() < 0.07) {
      const wrong = neighborKey(c, rng);
      shown += wrong;
      raw.push({ cost: 1, text: shown, key: wrong });
      shown = shown.slice(0, -1);
      raw.push({ cost: 1.6, text: shown, key: "backspace" }); // a beat to notice
    }
    shown += c;
    raw.push({ cost: 1, text: shown, key: c === " " ? null : c.toLowerCase() });
  }

  let total = 0;
  for (const e of raw) total += e.cost;
  const scale = typingFrames / (total || 1);
  let t = 0;
  const events: KeyEvent[] = raw.map((e) => {
    t += e.cost;
    return { at: t * scale, text: e.text, key: e.key };
  });
  typingCache.set(cacheKey, events);
  return events;
}

/**
 * Design frames (60fps) to delay each message's sound past its "send" frame
 * (delay + typingFrames) so it lands when the bubble is DELIVERED — i.e. when
 * its pop-in/bounce animation actually arrives on screen — instead of the
 * instant the composer fires. The bubble grows in over ~14 frames; ~9 puts
 * the sound on the visible landing, matching real iMessage. */
const DELIVERY_OFFSET = 9;

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
        // Human keystroke timeline (uniform tempo + the occasional typo/fix).
        const events = buildTyping(m.text, m.typingFrames);

        // Composer shows the text of the latest keystroke that has happened;
        // the active key is that keystroke if it's still inside its pop window.
        let best: KeyEvent | null = null;
        for (const e of events) {
          if (e.at <= local) best = e;
          else break;
        }
        composerText = best ? best.text : "";
        if (best && best.key && best.key !== "backspace") {
          const elapsed = local - best.at;
          if (elapsed < POP_HOLD) {
            pressedKey = best.key;
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
  showImageWatermark = false,
  clipStyle,
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

  // One soft "swoosh" per message, fired as each bubble is delivered (a beat
  // after its typing phase). `stop` is the next animated message's typing
  // start: message.mp3 is ~0.5s, so without a hard cap a swoosh can run INTO
  // the next bubble's typing — you'd hear the previous message's whoop while
  // the next one is still being typed. Each swoosh is clamped to end at `stop`.
  const sfxCues = useMemo(() => {
    // History bubbles are already on screen — they never "land", so no SFX.
    const visible = messages.filter(
      (m) => !m.history && (m.image || m.text.trim()),
    );
    return visible.map((m, i) => {
      const next = visible[i + 1];
      return {
        from: Math.max(
          0,
          Math.round(m.delay + m.typingFrames + DELIVERY_OFFSET),
        ),
        // Next message's typing starts at its delay; never sound past that.
        stop: next ? Math.round(next.delay) : Number.POSITIVE_INFINITY,
      };
    });
  }, [messages]);

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
          from: Math.max(
            0,
            Math.round(m.delay + m.typingFrames + DELIVERY_OFFSET),
          ),
          src: m.sound!.trim(),
        })),
    [messages],
  );
  const sfxSrc = useCachedSfx(MESSAGE_SFX);
  const keySfxSrc = useCachedSfx(KEY_SFX);

  // One keyboard-tap cue per physical keystroke, fired at the EXACT frame that
  // key visibly pops — driven by the same `buildTyping` timeline the on-screen
  // keyboard renders from, so taps land on letters, fat-finger typos AND
  // backspaces (every key with a sound). Spaces (key === null) are a silent
  // beat and skipped. Only with the keyboard shown, and only for OUTGOING text
  // messages (incoming text is the other person; photos run the attachment
  // flow, not typing). Each tap is wrapped in its own SHORT bounded <Sequence>
  // below so it unmounts right after it plays.
  //
  // History: per-keystroke audio was once removed because mounting ~one <Audio>
  // per character (100s across a chat) stuttered the Player and let audio drift
  // ahead of the picture. It's re-added here but (a) only in keyboard mode,
  // (b) capped at MAX_KEY_TAPS, (c) skipping spaces, and (d) on the lightweight
  // HTML5 <Audio> the Player now uses via SmartAudio — so the cue count stays
  // bounded and the engine stays cheap.
  const keyTapCues = useMemo(() => {
    if (!showKeyboard) return [] as number[];
    const cues: number[] = [];
    for (const m of messages) {
      if (m.history || m.side !== "right" || m.image) continue;
      if (!m.text.trim() || m.typingFrames <= 0) continue;
      for (const ev of buildTyping(m.text, m.typingFrames)) {
        if (ev.key === null) continue; // spacebar is a near-silent beat
        cues.push(Math.max(0, Math.round(m.delay + ev.at)));
        if (cues.length >= MAX_KEY_TAPS) return cues;
      }
    }
    return cues;
  }, [messages, showKeyboard]);

  // All cue frames above are computed in DESIGN frames (60fps) — the same clock
  // `useDesignFrame()` animates on. Audio <Sequence from> wants ACTUAL render
  // frames, so when the project is exported at a non-60 fps the cues must be
  // rescaled or every sound drifts out of sync. At 60fps this is a no-op.
  const toRenderFrame = (designFrame: number) =>
    Math.round((designFrame * fps) / DESIGN_FPS);

  // One-shot SFX must be wrapped in a SHORT, bounded Sequence so each <Audio>
  // unmounts right after it plays. An unbounded Sequence keeps every cue's
  // audio tag mounted until the end of the video, and the Player's classic
  // <Audio> caps simultaneous shared tags — lingering cues overflow it.
  // Durations are the real sound lengths (message ≈0.5s, presets ≤ fahhh's
  // 2.3s) scaled to render fps.
  const SWOOSH_FRAMES = Math.ceil(0.6 * fps);
  const CUSTOM_SFX_FRAMES = Math.ceil(2.5 * fps);
  // key.mp3 is ~0.085s; give it a hair of room, then unmount.
  const KEY_TAP_FRAMES = Math.max(1, Math.ceil(0.12 * fps));

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

  // Universal Style. Authentic iMessage defaults per appearance: sheet bg
  // (black/white), received-bubble text, SF Pro font, and the sent-bubble
  // blue as the accent. Overrides forwarded into the iMessage renderer.
  const s = resolveClipStyle(clipStyle, {
    background: theme === "dark" ? "#000000" : "#ffffff",
    color: theme === "dark" ? "#ffffff" : "#000000",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif",
    accent: IMESSAGE_GRADIENT,
  });
  // With a wallpaper the sheet stays the authentic black so the chrome reads;
  // otherwise the screen fill follows the universal background (transparent
  // when a Background Scene is chosen).
  const backdrop = backgroundImage ? "#000000" : s.background;

  return (
    <>
      {sfxCues.map((cue, i) => {
        const from = toRenderFrame(cue.from);
        const stop =
          cue.stop === Number.POSITIVE_INFINITY
            ? Number.POSITIVE_INFINITY
            : toRenderFrame(cue.stop);
        // Full swoosh length, but never past the next message's typing start.
        const duration = Math.max(1, Math.min(SWOOSH_FRAMES, stop - from));
        return (
          <Sequence
            key={`sfx-${i}`}
            from={from}
            durationInFrames={duration}
            name="message-sfx"
          >
            <SmartAudio src={sfxSrc} volume={0.8} />
          </Sequence>
        );
      })}
      {/* Per-bubble custom sound effects, layered on top of the swoosh. */}
      {customSfxCues.map((cue, i) => (
        <CachedSfxSequence
          key={`custom-sfx-${i}-${cue.from}`}
          path={cue.src}
          from={toRenderFrame(cue.from)}
          durationInFrames={CUSTOM_SFX_FRAMES}
          volume={1}
        />
      ))}
      {/* Per-keystroke keyboard taps (keyboard mode only). */}
      {keyTapCues.map((from, i) => (
        <Sequence
          key={`key-tap-${i}-${from}`}
          from={toRenderFrame(from)}
          durationInFrames={KEY_TAP_FRAMES}
          name="key-tap"
          layout="none"
        >
          <SmartAudio src={keySfxSrc} volume={0.4} />
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
          imageWatermark={showImageWatermark}
          clipBackground={s.background}
          clipColor={s.color}
          clipFontFamily={s.fontFamily}
          clipAccent={s.accent}
        />
      </ChatFill>
    </>
  );
};
