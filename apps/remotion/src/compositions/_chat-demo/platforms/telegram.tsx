"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Img, staticFile } from "remotion";
import type { ClipStyleDefaults } from "../../../clip-style";
import { asset } from "../../../lib/asset";
import { BubbleEnter, CurvedBubble, DoodleTiles, TypingDots } from "../bubbles";
import { AttachmentIcon, EmojiIcon, MicIcon } from "../icons";
import { curvedThread } from "../threads";
import type { ChatMessageItem } from "../types";

/* =========================================================================
 * Telegram — iMessage bubble shape + Telegram SVG palette and chrome.
 * Source: .context/attachments/Telegram Chat.svg
 * ========================================================================= */

export function TelegramDemo({
  messages,
  title,
  headerAvatar,
  clip,
}: {
  messages: ChatMessageItem[];
  title?: string;
  headerAvatar?: string;
  clip: ClipStyleDefaults;
}) {
  // Palette extracted from Telegram Chat.svg. The universal Style overrides the
  // chat-screen wallpaper (blueOverlay), primary text, root font, and the
  // Telegram-blue accent (header/composer icons). Bubbles/meta stay authentic.
  const chromeBg = "#F6F6F6";
  const blueOverlay = clip.background;
  const myBubble = "#E1FEC6";
  const theirBubble = "#FFFFFF";
  const textColor = clip.color;
  const metaColor = "#858E99";
  const myMeta = "#3EAA3C";
  const accent = clip.accent;
  const fontStack = clip.fontFamily;

  const grouped = curvedThread(messages);

  return (
    <div
      className="flex h-full flex-col"
      style={{ fontFamily: fontStack, color: textColor, background: chromeBg }}
    >
      {/* iOS header */}
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
            <span
              style={{ fontSize: 17, marginLeft: 8, letterSpacing: "-0.01em" }}
            >
              Back
            </span>
          </div>
          <div className="flex flex-col items-center" style={{ minWidth: 0 }}>
            <span
              style={{
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: textColor,
                maxWidth: 160,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title ?? "GAIA"}
            </span>
            <span style={{ fontSize: 12, color: metaColor, marginTop: 1 }}>
              last seen recently
            </span>
          </div>
          <div
            className="flex items-center justify-end"
            style={{ color: accent }}
          >
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
          </div>
        </div>
        <div style={{ height: 0.5, background: "rgba(60,60,67,0.18)" }} />
      </div>

      {/* Chat area: blue overlay + Telegram doodle pattern */}
      <div
        className="relative flex flex-1 flex-col overflow-y-auto px-3 pb-3"
        style={{
          scrollbarWidth: "none",
          gap: 8,
          backgroundColor: blueOverlay,
          paddingTop: 8,
        }}
      >
        <DoodleTiles
          src={staticFile("telegram-doodle.png")}
          tileW={480}
          tileH={752}
          cols={3}
          rows={2}
        />
        <div
          className="relative flex flex-1 flex-col"
          style={{ gap: 8, zIndex: 2 }}
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
                  const showMeta = !m.typing && m.time;
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
                                color: isMe ? myMeta : metaColor,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              {m.time ?? ""}
                            </span>
                          ) : undefined
                        }
                      >
                        {m.typing ? (
                          <TypingDots color={isMe ? myMeta : metaColor} />
                        ) : (
                          m.text
                        )}
                      </CurvedBubble>
                    </BubbleEnter>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="flex shrink-0 items-center gap-2 px-2 pt-2 pb-1.5"
        style={{ background: chromeBg }}
      >
        <button
          type="button"
          aria-label="Attach"
          className="flex cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/[0.06]"
          style={{ width: 30, height: 30, color: accent }}
        >
          <AttachmentIcon />
        </button>
        <div
          className="flex flex-1 items-center justify-between gap-2"
          style={{
            background: "#FFFFFF",
            border: "0.5px solid #D1D1D6",
            borderRadius: 16,
            padding: "0 12px",
            height: 32,
            color: metaColor,
          }}
        >
          <input
            type="text"
            placeholder="Message"
            className="chat-demo-input min-w-0 flex-1 border-0 bg-transparent p-0 outline-none placeholder:text-[#858E99]"
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
            style={{ color: metaColor, width: 22, height: 22 }}
          >
            <EmojiIcon size={18} />
          </button>
        </div>
        <button
          type="button"
          aria-label="Voice"
          className="flex cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/[0.06]"
          style={{ width: 30, height: 30, color: accent }}
        >
          <MicIcon />
        </button>
      </div>
    </div>
  );
}
