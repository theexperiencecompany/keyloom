import type React from "react";
import { EmojiText } from "./Emoji";
import { IOS26_BLUE, type Look, RECEIVED_GREY } from "./look";

// iOS iMessage light-mode palette.
export const SENT_BLUE = "#0A7CFF";
export const META_GREY = "#8E8E93";

// Tail silhouettes (same as gaia-ui chat-demo), drawn via clip-path.
const TAIL_LEFT =
  "M 20 0 L 20 2 A 16 16 0 0 1 4 18 L 0 18 L 0 17.54 A 10 10 0 0 0 7 8 L 7 0 Z";
const TAIL_RIGHT =
  "M 0 0 L 0 2 A 16 16 0 0 0 16 18 L 20 18 L 20 17.54 A 10 10 0 0 1 13 8 L 13 0 Z";

// iOS 26 droplet tails, traced from the reference SVG: origin at the body's bottom
// corner, hanging 6pt below it and never past the bubble's side edge. Each closes
// inside the body, so the tail curve (not the body's radius) forms that corner.
const DROPLET_SENT =
  "M-19.163 0C-19.104 0-19.053.04-19.006.076C-13.716 4.147-11.001 6.107-7.519 5.993C-7.352 5.988-7.274 5.79-7.385 5.666C-9.634 3.156-10.376 1.884-10.157.942C-10.018.011-8.325-2.243-7.048-3.693C-7.007-3.74-6.962-3.782-6.913-3.82C-2.705-7.115 0-12.241 0-18L-19.163-18Z";
const DROPLET_RECEIVED =
  "M18.866 0C18.808 0 18.759.039 18.713.075C13.505 4.146 10.831 6.106 7.403 5.993C7.238 5.988 7.16 5.792 7.269 5.668C9.484 3.157 10.216 1.885 10 .942C9.853-.057 7.943-2.582 6.67-4C6.636-4.037 6.601-4.071 6.562-4.102C2.555-7.404 0-12.403 0-18L18.866-18Z";
const DROPLET_W = 20;
export const DROPLET_DROP = 6;

/** The iOS 26 tail. Render it before the body so the body (and its text) paints over it. */
export function DropletTail({
  side,
  color,
}: {
  side: "left" | "right";
  color: string;
}) {
  const sent = side === "right";
  return (
    <svg
      width={DROPLET_W}
      height={18 + DROPLET_DROP}
      viewBox={`${sent ? -DROPLET_W : 0} -18 ${DROPLET_W} ${18 + DROPLET_DROP}`}
      style={{
        position: "absolute",
        bottom: -DROPLET_DROP,
        [sent ? "right" : "left"]: 0,
        display: "block",
      }}
      aria-hidden
    >
      <path d={sent ? DROPLET_SENT : DROPLET_RECEIVED} fill={color} />
    </svg>
  );
}

export const BUBBLE_MAX_W = 262;

export function TextBubble({
  look,
  side,
  tail,
  text,
  children,
}: {
  look: Look;
  side: "left" | "right";
  tail: boolean;
  text: string;
  children?: React.ReactNode;
}) {
  const sent = side === "right";
  if (look === "ios26") {
    const fill = sent ? IOS26_BLUE : RECEIVED_GREY;
    return (
      <div style={{ position: "relative", maxWidth: BUBBLE_MAX_W }}>
        {tail && <DropletTail side={side} color={fill} />}
        <div
          style={{
            position: "relative",
            background: fill,
            color: sent ? "#FFFFFF" : "#000",
            padding: "7px 13px",
            borderRadius: 18,
            fontSize: 17,
            lineHeight: "22px",
            letterSpacing: "-0.022em",
            wordBreak: "break-word",
            whiteSpace: "pre-line",
          }}
        >
          <EmojiText text={text} />
        </div>
        {children}
      </div>
    );
  }
  const bg = sent ? SENT_BLUE : RECEIVED_GREY;
  return (
    <div style={{ position: "relative", maxWidth: BUBBLE_MAX_W }}>
      <div
        style={{
          background: bg,
          color: sent ? "#fff" : "#000",
          padding: "7px 13px 8px",
          borderRadius: 19,
          fontSize: 17,
          lineHeight: "22px",
          letterSpacing: "-0.022em",
          wordBreak: "break-word",
          whiteSpace: "pre-line",
        }}
      >
        <EmojiText text={text} />
      </div>
      {tail && (
        <span
          style={{
            position: "absolute",
            bottom: 0,
            [sent ? "right" : "left"]: -7,
            width: 20,
            height: 18,
            background: bg,
            clipPath: `path('${sent ? TAIL_RIGHT : TAIL_LEFT}')`,
          }}
        />
      )}
      {children}
    </div>
  );
}

// iOS typing indicator: grey pill, three dots pulsing in sequence, and a
// two-circle "thought bubble" tail at the bottom-left.
export function TypingBubble({ t }: { t: number }) {
  return (
    <div style={{ position: "relative", width: 58, height: 38 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 19,
          background: RECEIVED_GREY,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
        }}
      >
        {[0, 1, 2].map((i) => {
          const phase = (t * 1.6 - i * 0.18) % 1;
          const pulse =
            phase < 0
              ? 0
              : Math.max(0, Math.sin(Math.min(phase, 0.5) * 2 * Math.PI));
          return (
            <span
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: META_GREY,
                opacity: 0.45 + 0.5 * pulse,
              }}
            />
          );
        })}
      </div>
      <span
        style={{
          position: "absolute",
          left: -1,
          bottom: -1,
          width: 13,
          height: 13,
          borderRadius: 7,
          background: RECEIVED_GREY,
        }}
      />
      <span
        style={{
          position: "absolute",
          left: -6,
          bottom: -6,
          width: 6,
          height: 6,
          borderRadius: 3,
          background: RECEIVED_GREY,
        }}
      />
    </div>
  );
}

export function Divider({
  day,
  time,
  look,
}: {
  day: string;
  time: string;
  look: Look;
}) {
  if (look === "ios26") {
    return (
      <div
        style={{
          textAlign: "center",
          fontSize: 12,
          lineHeight: "16px",
          fontWeight: 500,
          color: META_GREY,
        }}
      >
        {`${day} at ${time}`}
      </div>
    );
  }
  return (
    <div
      style={{
        textAlign: "center",
        fontSize: 12,
        lineHeight: "16px",
        color: META_GREY,
        letterSpacing: "-0.005em",
      }}
    >
      <span style={{ fontWeight: 600 }}>{day}</span> {time}
    </div>
  );
}
