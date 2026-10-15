import type React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { continueRender, delayRender, spring } from "remotion";
import { DESIGN_FPS, useDesignFrame } from "../../use-design-frame";
import { Keyboard } from "../_chat-demo/Keyboard";
import { Divider, DROPLET_DROP, TextBubble, TypingBubble } from "./Bubble";
import { SEND_PAUSE } from "./build";
import { ComposerIOS26 } from "./ComposerIOS26";
import { loadSFPro, SF_TEXT } from "./fonts";
import { HeaderIOS26 } from "./HeaderIOS26";
import type { Look } from "./look";
import { SCREEN_W } from "./Phone";
import {
  EmojiText,
  ImageStack,
  Img,
  LinkCard,
  Receipt,
  TAPBACK_OVERHANG,
  Tapback,
  tapbackSpring,
  threadAsset,
} from "./parts";
import { TAPBACK_IOS26_OVERHANG, TapbackIOS26 } from "./TapbackIOS26";
import type { Sender, ThreadItem } from "./types";

type Slot = Exclude<ThreadItem, { kind: "reaction" }>;
type Reaction = Extract<ThreadItem, { kind: "reaction" }>;

const TYPING_H = 38;
const HEADER_H = 150;
const STACK_W = 232;
const READ_AFTER = 1.1; // "Delivered" becomes "Read" this long after sending
const READ_FADE = 0.2;

// Thread spacing per look. iOS 26 values come from the reference SVG: received bubbles
// 28pt from the left edge, sent 24pt from the right, 17pt between senders, 26pt from
// the last bubble to the floating composer.
type Metrics = {
  padLeft: number;
  padRight: number;
  padBottom: number;
  gapSame: number;
  gapOther: number;
  gapAfterDivider: number;
  gapBeforeDivider: number;
  gapFirstDivider: number;
  receiptH: number;
  /** Room between the bubble and its receipt, so the droplet tail never touches "Delivered". */
  receiptTop: number;
  /** How far a landing row's content may paint below the row while it is clipped. */
  clipBelow: number;
};

const METRICS: Record<Look, Metrics> = {
  ios18: {
    padLeft: 12,
    padRight: 12,
    padBottom: 10,
    gapSame: 3,
    gapOther: 10,
    gapAfterDivider: 10,
    gapBeforeDivider: 18,
    gapFirstDivider: 4,
    receiptH: 18,
    receiptTop: 0,
    clipBelow: 0,
  },
  ios26: {
    padLeft: 28,
    padRight: 24,
    padBottom: 26,
    gapSame: 3,
    gapOther: 17,
    gapAfterDivider: 15,
    gapBeforeDivider: 15,
    gapFirstDivider: 4,
    receiptH: 24,
    receiptTop: DROPLET_DROP,
    clipBelow: DROPLET_DROP + 2,
  },
};

const sideOf = (s: Sender) => (s === "user" ? "right" : "left");
const startOf = (s: Slot) => s.at - ("typing" in s && s.typing ? s.typing : 0);

function gapBetween(m: Metrics, prev: Slot | undefined, item: Slot) {
  if (item.kind === "divider")
    return prev ? m.gapBeforeDivider : m.gapFirstDivider;
  if (!prev) return m.gapOther;
  if (prev.kind === "divider") return m.gapAfterDivider;
  return prev.from === item.from ? m.gapSame : m.gapOther;
}

function Content({
  item,
  tail,
  look,
}: {
  item: Slot;
  tail: boolean;
  look: Look;
}) {
  switch (item.kind) {
    case "divider":
      return <Divider day={item.day} time={item.time} look={look} />;
    case "text":
      return (
        <TextBubble
          look={look}
          side={sideOf(item.from)}
          tail={tail}
          text={item.text}
        />
      );
    case "images":
      return (
        <ImageStack
          srcs={item.srcs}
          progress={1}
          width={STACK_W}
          aspect={item.aspect ?? 1.9}
        />
      );
    case "link":
      return (
        <LinkCard
          title={item.title}
          domain={item.domain}
          image={item.image}
          progress={1}
          look={look}
        />
      );
  }
}

// Measures each item's final height once (after fonts load) so the thread can
// animate exact heights frame by frame.
function useHeights(items: Slot[], look: Look) {
  const ref = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState<Record<string, number> | null>(null);
  const [handle] = useState(() => delayRender("measure thread"));
  useLayoutEffect(() => {
    let cancelled = false;
    // Heights must be measured in SF Pro; the fallback font wraps differently.
    loadSFPro().then(() => {
      if (cancelled || !ref.current) return;
      const out: Record<string, number> = {};
      for (const el of Array.from(ref.current.children) as HTMLElement[]) {
        out[el.dataset.id as string] = el.offsetHeight;
      }
      setHeights(out);
      continueRender(handle);
    });
    return () => {
      cancelled = true;
    };
  }, [handle]);
  const measurer = (
    <div
      ref={ref}
      style={{
        position: "absolute",
        visibility: "hidden",
        width: SCREEN_W - METRICS[look].padLeft - METRICS[look].padRight,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      {items.map((it) => (
        <div key={it.id} data-id={it.id}>
          <Content item={it} tail look={look} />
        </div>
      ))}
    </div>
  );
  return { heights, measurer };
}

export function Thread({
  script,
  contactName,
  contactAvatar,
  keyboard = false,
  look,
}: {
  script: ThreadItem[];
  contactName: string;
  /** Path under public/imessage-thread/. */
  contactAvatar: string;
  /** Show the iOS 18 keyboard under the composer, with keys popping as the user types. The iOS 26 look has no keyboard. */
  keyboard?: boolean;
  look: Look;
  /** TEMPORARY: which Liquid Glass treatment the iOS 26 chrome uses. */
}) {
  const m = METRICS[look];
  const frame = useDesignFrame();
  const fps = DESIGN_FPS;
  const t = frame / fps;
  const slots = script.filter((s): s is Slot => s.kind !== "reaction");
  const reactions = script.filter((s): s is Reaction => s.kind === "reaction");
  const { heights, measurer } = useHeights(slots, look);

  const sp = (at: number, damping = 200, durationInFrames?: number) =>
    spring({
      frame: frame - Math.round(at * fps),
      fps,
      config: { damping },
      durationInFrames,
    });

  // Finger press on a tapped card: quick in, slower release.
  const pressOf = (tapAt?: number) => {
    if (tapAt === undefined || t < tapAt) return 0;
    const d = t - tapAt;
    return d < 0.12 ? d / 0.12 : Math.max(0, 1 - (d - 0.12) / 0.3);
  };

  const visible = slots.filter((s) => startOf(s) <= t);
  const landed = (s: Slot) => t >= s.at;

  const rows: React.ReactNode[] = [];
  visible.forEach((item, i) => {
    const from = item.kind === "divider" ? null : item.from;
    const gap = gapBetween(m, visible[i - 1], item);

    const appear = sp(startOf(item), 200, 12);
    const land = sp(item.at, 200, 12);
    const finalH = heights?.[item.id] ?? 0;
    const typing = "typing" in item && !!item.typing;
    const contentH = typing
      ? TYPING_H + (finalH - TYPING_H) * (landed(item) ? land : 0)
      : finalH;

    const reaction = reactions.find((r) => r.target === item.id && t >= r.at);
    const rp = reaction
      ? tapbackSpring(frame - Math.round(reaction.at * fps), fps)
      : 0;
    // Both looks' badges sit above the bubble's top corner.
    const overhang =
      look === "ios26" ? TAPBACK_IOS26_OVERHANG : TAPBACK_OVERHANG;
    const reactionRoom = Math.max(0, overhang + 3 - gap);
    const reactionGrow = reaction
      ? reactionRoom * Math.min(1, sp(reaction.at, 200, 10))
      : 0;
    let extra = reactionGrow;

    // "Delivered" → "Read" under the user's latest message while it's the newest thing in the thread.
    // The receipt stays through the reply's typing dots and collapses as the next message lands.
    const replyAt = slots
      .slice(slots.indexOf(item) + 1)
      .find((v) => v.kind !== "divider")?.at;
    const receiptIn =
      item.kind !== "divider" && item.from === "user" && landed(item)
        ? sp(item.at + 0.35, 200, 8)
        : 0;
    const receiptOut =
      replyAt !== undefined && t >= replyAt ? sp(replyAt, 200, 12) : 0;
    const receiptP = receiptIn * (1 - receiptOut);
    const isLatestUser = receiptP > 0.001;
    const readK = Math.max(
      0,
      Math.min(1, (t - (item.at + READ_AFTER)) / READ_FADE),
    );
    const readTime = [...visible.slice(0, i)]
      .reverse()
      .find((v) => v.kind === "divider");
    extra += m.receiptH * receiptP;
    const below = m.receiptH * receiptP;

    // Tail on the last bubble of a run; the same sender's next item (even its typing dots) takes it over.
    const next = visible[i + 1];
    const tail = !(
      next &&
      next.kind !== "divider" &&
      from &&
      next.from === from
    );

    const side = from ? sideOf(from) : "left";
    const origin = side === "right" ? "bottom right" : "bottom left";

    rows.push(
      <div
        key={item.id}
        style={{
          position: "relative",
          flexShrink: 0,
          height: (gap + contentH + extra) * appear,
          // Clip while the slot is still growing so landing content never paints over the row above.
          // Clip only vertically while growing, so a landing bubble's side tail stays visible.
          clipPath:
            appear < 0.999 || (landed(item) && land < 0.999)
              ? m.clipBelow
                ? `inset(0 -40px -${m.clipBelow}px)`
                : "inset(0 -40px)"
              : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: below,
            display: "flex",
            justifyContent:
              item.kind === "divider"
                ? "center"
                : side === "right"
                  ? "flex-end"
                  : "flex-start",
          }}
        >
          {typing && !landed(item) ? (
            <div
              style={{
                transform: `scale(${0.6 + 0.4 * appear})`,
                transformOrigin: origin,
                opacity: appear,
              }}
            >
              <TypingBubble t={t} />
            </div>
          ) : (
            <div
              style={{
                position: "relative",
                transform: `scale(${0.9 + 0.1 * land})`,
                transformOrigin: origin,
                opacity: typing
                  ? Math.max(0, Math.min(1, (land - 0.35) / 0.5))
                  : Math.min(1, land * 1.6),
              }}
            >
              {item.kind === "images" ? (
                <div
                  style={{
                    transform: `scale(${1 - 0.035 * pressOf(item.tapAt)})`,
                    filter: `brightness(${1 - 0.12 * pressOf(item.tapAt)})`,
                    transformOrigin: "center",
                  }}
                >
                  <ImageStack
                    srcs={item.srcs}
                    progress={land}
                    width={STACK_W}
                    aspect={item.aspect ?? 1.9}
                  />
                </div>
              ) : item.kind === "link" ? (
                <div
                  style={{
                    transform: `scale(${1 - 0.035 * pressOf(item.tapAt)})`,
                    filter: `brightness(${1 - 0.12 * pressOf(item.tapAt)})`,
                    transformOrigin: "center",
                  }}
                >
                  <LinkCard
                    title={item.title}
                    domain={item.domain}
                    image={item.image}
                    progress={land}
                    look={look}
                  />
                </div>
              ) : (
                <Content item={item} tail={tail} look={look} />
              )}
              {isLatestUser && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    height: m.receiptH * receiptP,
                    overflow: "hidden",
                    // Both receipts share one grid cell, so the box is as wide as "Read 3:14 PM", not just "Delivered".
                    display: "grid",
                    justifyItems: "end",
                    paddingTop: m.receiptTop,
                    boxSizing: "border-box",
                  }}
                >
                  {/* "Delivered" crossfades into "Read" rather than swapping on one frame. */}
                  <div style={{ gridArea: "1 / 1" }}>
                    <Receipt
                      status="delivered"
                      progress={receiptP * (1 - readK)}
                    />
                  </div>
                  <div style={{ gridArea: "1 / 1" }}>
                    <Receipt
                      status="read"
                      time={
                        readTime && readTime.kind === "divider"
                          ? readTime.time
                          : undefined
                      }
                      progress={receiptP * readK}
                    />
                  </div>
                </div>
              )}
              {reaction &&
                (look === "ios26" ? (
                  <TapbackIOS26
                    emoji={reaction.emoji}
                    by={reaction.by}
                    side={side}
                    progress={rp}
                  />
                ) : (
                  <Tapback
                    emoji={reaction.emoji}
                    by={reaction.by}
                    side={side}
                    progress={rp}
                    tailProgress={sp(reaction.at, 200, 14)}
                  />
                ))}
            </div>
          )}
          {typing && landed(item) && land < 0.6 && (
            <div
              style={{
                position: "absolute",
                left: 0,
                bottom: below,
                opacity: 1 - land / 0.6,
              }}
            >
              <TypingBubble t={t} />
            </div>
          )}
        </div>
      </div>,
    );
  });

  // What the user is typing right now (text messages from "user" carry `compose` seconds).
  const composing = slots.find(
    (s): s is Extract<Slot, { kind: "text" }> =>
      s.kind === "text" &&
      s.from === "user" &&
      !!s.compose &&
      t < s.at &&
      t >= s.at - s.compose - SEND_PAUSE,
  );
  let draft = "";
  let pressedKey: string | null = null;
  let pressT = 0;
  if (composing) {
    const chars = Array.from(composing.text);
    const k = Math.min(
      1,
      (t - (composing.at - (composing.compose ?? 0) - SEND_PAUSE)) /
        (composing.compose ?? 1),
    );
    const revealed = Math.round(chars.length * k);
    draft = chars.slice(0, revealed).join("");
    const lastTyped = chars[revealed - 1];
    if (k < 1 && lastTyped) {
      pressedKey = lastTyped.toLowerCase();
      pressT = (chars.length * k + 0.5) % 1;
    }
  }

  // Fullscreen photo viewer: a tap on an images beat expands its front photo
  // over the whole thread for the tap's hold, iOS Photos style.
  let expandedSrc: string | null = null;
  let expandedK = 0;
  for (const s of slots) {
    if (
      s.kind === "images" &&
      s.tapAt !== undefined &&
      s.expandUntil !== undefined &&
      t >= s.tapAt &&
      t < s.expandUntil
    ) {
      const first = s.srcs[0];
      if (first) {
        expandedSrc = first;
        const dt = t - s.tapAt;
        const total = s.expandUntil - s.tapAt;
        const fade = 0.15;
        expandedK = Math.min(1, dt / fade, (total - dt) / fade);
      }
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {measurer}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: `0 ${m.padRight}px ${m.padBottom}px ${m.padLeft}px`,
        }}
      >
        {heights && rows}
      </div>
      {look === "ios26" ? (
        <>
          <HeaderIOS26 name={contactName} avatar={contactAvatar} />
          <ComposerIOS26 draft={draft} />
        </>
      ) : (
        <>
          <Header name={contactName} avatar={contactAvatar} />
          <Composer draft={draft} keyboard={keyboard} />
        </>
      )}
      {look === "ios18" && keyboard && (
        <Keyboard
          pressedKey={pressedKey}
          pressT={pressT}
          width={SCREEN_W}
          fontFamily={SF_TEXT}
        />
      )}
      {expandedSrc && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#000",
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: Math.max(0, Math.min(1, expandedK)),
          }}
        >
          <Img
            src={threadAsset(expandedSrc)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
              transform: `scale(${0.92 + 0.08 * Math.max(0, Math.min(1, expandedK))})`,
            }}
          />
        </div>
      )}
    </div>
  );
}

const BLUE = "#007AFF";

function Header({ name, avatar }: { name: string; avatar: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: HEADER_H,
        paddingTop: 54,
        background: "rgba(248,248,248,0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: "0.5px solid rgba(0,0,0,0.12)",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <svg
        width="12"
        height="21"
        viewBox="0 0 12 21"
        style={{ position: "absolute", left: 16, top: 80 }}
      >
        <path
          d="M10 2L2 10.5L10 19"
          stroke={BLUE}
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        width="27"
        height="18"
        viewBox="0 0 27 18"
        style={{ position: "absolute", right: 16, top: 82 }}
      >
        <rect
          x="1"
          y="1.5"
          width="17"
          height="15"
          rx="4"
          stroke={BLUE}
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M19.5 7L25.5 3.5V14.5L19.5 11Z"
          stroke={BLUE}
          strokeWidth="2"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <Img
        src={threadAsset(avatar)}
        style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          objectFit: "cover",
          marginTop: 6,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          marginTop: 5,
          fontSize: 12,
          letterSpacing: "-0.01em",
        }}
      >
        <span>{name}</span>
        <svg width="5" height="9" viewBox="0 0 7 11">
          <path
            d="M1 1l4.5 4.5L1 10"
            stroke="rgba(60,60,67,0.35)"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

function Composer({ draft, keyboard }: { draft: string; keyboard: boolean }) {
  const typing = draft.length > 0;
  return (
    <div
      style={{
        flexShrink: 0,
        // With the keyboard up, the home-indicator gap belongs to the keyboard, not the composer.
        padding: keyboard ? "8px 12px 6px" : "8px 12px 40px",
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
        background: "#fff",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: 18,
          background: "#EDEDEF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path
            d="M8 1.5v13M1.5 8h13"
            stroke="#7C7C80"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 36,
          borderRadius: 18,
          border: "1px solid rgba(60,60,67,0.2)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: "3px 3px 3px 14px",
          fontSize: 17,
          lineHeight: "22px",
          letterSpacing: "-0.02em",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 28,
            // 2pt bottom padding lifts the line 1pt so its ink sits on the pill's optical centre.
            paddingBottom: 2,
            display: "flex",
            alignItems: "center",
            wordBreak: "break-word",
          }}
        >
          {typing ? (
            <span style={{ color: "#000" }}>
              <EmojiText text={draft} />
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: 21,
                  marginLeft: 1,
                  verticalAlign: "-4px",
                  borderRadius: 1,
                  background: BLUE,
                }}
              />
            </span>
          ) : (
            <span style={{ color: "rgba(60,60,67,0.3)" }}>iMessage</span>
          )}
        </div>
        {typing ? (
          <div
            style={{
              width: 28,
              height: 28,
              flexShrink: 0,
              borderRadius: 14,
              background: BLUE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 6,
            }}
          >
            <svg width="14" height="16" viewBox="0 0 14 16">
              <path
                d="M7 14.5V2M1.5 7.5L7 2l5.5 5.5"
                stroke="#fff"
                strokeWidth="2.4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ) : (
          <svg
            width="14"
            height="20"
            viewBox="0 0 14 20"
            style={{ margin: "4px 6px", flexShrink: 0 }}
          >
            <rect x="4" y="1" width="6" height="11" rx="3" fill="#8E8E93" />
            <path
              d="M1.5 9a5.5 5.5 0 0 0 11 0M7 14.5V18.5"
              stroke="#8E8E93"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
