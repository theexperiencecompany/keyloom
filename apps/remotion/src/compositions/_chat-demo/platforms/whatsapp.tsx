"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Img, staticFile } from "remotion";
import { asset } from "../../../lib/asset";
import { BubbleEnter, CurvedBubble, DoodleTiles, TypingDots } from "../bubbles";
import { CameraIcon, EmojiIcon, MicIcon } from "../icons";
import { type ClipOverrides, ov } from "../overrides";
import { SF_PRO_STACK } from "../sf-pro";
import { curvedThread } from "../threads";
import type { ChatMessageItem } from "../types";

/* =========================================================================
 * WhatsApp — iMessage bubble shape + WhatsApp SVG colors and chrome.
 * Source: .context/attachments/WhatsApp Chat.svg
 * ========================================================================= */

export function WhatsAppDemo({
  messages,
  title,
  subtitle: _subtitle,
  headerAvatar,
  showComposer,
  className,
  clip,
}: {
  messages: ChatMessageItem[];
  title?: string;
  subtitle?: string;
  headerAvatar?: string;
  showComposer: boolean;
  className?: string;
  clip?: ClipOverrides;
}) {
  // Palette extracted from WhatsApp Chat.svg. The universal Style controls
  // override the chat-screen background, primary text, root font, and the
  // signature green outgoing bubble (accent); chrome/incoming/meta stay
  // authentic.
  const bg = ov(clip?.background, "#EFEFF4");
  const chromeBg = "#F6F6F6";
  const myBubble = ov(clip?.accent, "#DCF7C5");
  const theirBubble = "#FFFFFF";
  const textColor = ov(clip?.color, "#060606");
  const metaColor = "rgba(0,0,0,0.45)";
  const accent = "#007AFF";
  const fontStack = ov(clip?.fontFamily, SF_PRO_STACK);

  const grouped = curvedThread(messages);

  return (
    <div
      className={cn("flex h-full flex-col", className)}
      style={{ background: bg, fontFamily: fontStack, color: textColor }}
    >
      {/* Header — iOS chrome from WhatsApp Chat.svg (#F6F6F6) */}
      <div className="flex shrink-0 flex-col" style={{ background: chromeBg }}>
        <div
          className="grid items-center"
          style={{
            gridTemplateColumns: "1fr auto 1fr",
            padding: "6px 12px 8px",
            gap: 8,
          }}
        >
          <div className="flex items-center" style={{ color: accent }}>
            <svg
              width="12"
              height="20"
              viewBox="0 0 12 20"
              aria-hidden
              fill="none"
            >
              <path
                d="M10 2 2 10l8 8"
                stroke={accent}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex flex-col items-center" style={{ minWidth: 0 }}>
            <div
              className="overflow-hidden rounded-full"
              style={{ width: 32, height: 32 }}
            >
              <Img
                src={asset(headerAvatar) ?? ""}
                crossOrigin="anonymous"
                alt=""
                style={{ width: 32, height: 32, objectFit: "cover" }}
              />
            </div>
            <span
              style={{
                fontSize: 10,
                marginTop: 2,
                color: textColor,
                letterSpacing: "-0.01em",
                maxWidth: 140,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title ?? "GAIA"}
            </span>
          </div>
          <div
            className="flex items-center justify-end"
            style={{ color: accent }}
          >
            <svg
              width="22"
              height="14"
              viewBox="0 0 22 14"
              aria-hidden
              fill="none"
            >
              <rect
                x="0.5"
                y="0.5"
                width="15"
                height="13"
                rx="3"
                stroke={accent}
              />
              <path
                d="M16 4l5 -3v12l-5 -3z"
                fill={accent}
                stroke={accent}
                strokeWidth="0.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div style={{ height: 0.5, background: "rgba(60,60,67,0.18)" }} />
      </div>

      {/* Chat area — light gray with the WhatsApp doodle pattern */}
      <div
        className="relative flex flex-1 flex-col overflow-y-auto px-3 pb-3"
        style={{
          scrollbarWidth: "none",
          gap: 8,
          backgroundColor: bg,
          paddingTop: 8,
        }}
      >
        <DoodleTiles
          src={staticFile("whatsapp-doodle.png")}
          tileW={404}
          tileH={695}
          cols={4}
          rows={2}
        />
        <div
          className="relative flex flex-1 flex-col"
          style={{ gap: 8, zIndex: 1 }}
        >
          {grouped.map((group, gi) => {
            const isMe = group.from === "me";
            return (
              <div
                key={gi}
                className={cn(
                  "flex flex-col",
                  isMe ? "items-end" : "items-start",
                )}
                style={{ gap: 2 }}
              >
                {group.items.map((m, i) => {
                  const isLast = i === group.items.length - 1;
                  const showMeta = !m.typing && (m.time || (isMe && m.status));
                  return (
                    <BubbleEnter
                      key={m.id ?? `${gi}-${i}`}
                      enterFrames={m.enterFrames}
                      from={group.from}
                    >
                      <CurvedBubble
                        from={group.from}
                        tail={isLast}
                        background={isMe ? myBubble : theirBubble}
                        tailColor={isMe ? myBubble : theirBubble}
                        color={textColor}
                        meta={
                          showMeta ? (
                            <span
                              style={{
                                color: metaColor,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              {m.time ?? ""}
                              {isMe && m.status && (
                                <WhatsAppTicks status={m.status} />
                              )}
                            </span>
                          ) : undefined
                        }
                      >
                        {m.typing ? <TypingDots color={metaColor} /> : m.text}
                      </CurvedBubble>
                    </BubbleEnter>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {showComposer && (
        <div
          className="flex shrink-0 items-center gap-2 px-2 pt-2 pb-1.5"
          style={{ background: chromeBg }}
        >
          <button
            type="button"
            aria-label="Camera"
            className="flex cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/[0.06]"
            style={{ width: 32, height: 32, color: "#3C3C43" }}
          >
            <CameraIcon />
          </button>
          <div
            className="flex flex-1 items-center justify-between gap-2"
            style={{
              background: "#FFFFFF",
              border: "0.5px solid #8E8E93",
              borderRadius: 16,
              padding: "0 10px",
              height: 32,
              color: "#8E8E93",
            }}
          >
            <input
              type="text"
              placeholder="Message"
              className="chat-demo-input min-w-0 flex-1 border-0 bg-transparent p-0 outline-none placeholder:text-[#8E8E93]"
              style={{
                fontSize: 15,
                color: "#000",
                letterSpacing: "-0.01em",
                fontFamily: "inherit",
              }}
            />
            <button
              type="button"
              aria-label="Emoji"
              className="flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/[0.06]"
              style={{ color: "#8E8E93", width: 22, height: 22 }}
            >
              <EmojiIcon size={18} />
            </button>
          </div>
          <button
            type="button"
            aria-label="Voice message"
            className="flex cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/[0.06]"
            style={{ width: 32, height: 32, color: "#3C3C43" }}
          >
            <MicIcon />
          </button>
        </div>
      )}
    </div>
  );
}

function WhatsAppTicks({ status }: { status: "sent" | "delivered" | "read" }) {
  const color = status === "read" ? "#3497F9" : "rgba(0,0,0,0.4)";
  if (status === "sent") {
    return (
      <svg width="14" height="11" viewBox="0 0 14 11" aria-hidden fill="none">
        <path
          d="M1 6l3.5 3.5L11 2"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // TickDouble02-style: two clean overlapping check marks
  return (
    <svg width="16" height="11" viewBox="0 0 18 14" aria-hidden fill="none">
      <path
        d="M1 7l3.2 3.5L11 3.5"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 7l3.2 3.5L17 3.5"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
