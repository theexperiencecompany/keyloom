"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Img } from "remotion";
import { asset } from "../../../lib/asset";
import { BubbleEnter, TypingDots } from "../bubbles";
import { DEFAULT_AVATAR } from "../defaults";
import { DiscordGiftIcon, DiscordStickerIcon, MicIcon } from "../icons";
import { type ClipOverrides, ov } from "../overrides";
import { groupByAuthor, pickColor } from "../threads";
import type { ChatMessageItem } from "../types";

const DISCORD_STACK =
  '"gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif';

/* =========================================================================
 * Discord — chrome and composer matched to the iOS screenshot
 * (CleanShot 2026-05-11 at 13.05.53@2x.png)
 * ========================================================================= */

export function DiscordDemo({
  messages,
  title,
  subtitle: _subtitle,
  showComposer,
  className,
  clip,
}: {
  messages: ChatMessageItem[];
  title?: string;
  subtitle?: string;
  showComposer: boolean;
  className?: string;
  clip?: ClipOverrides;
}) {
  // Universal Style overrides the dark channel background, primary text, root
  // font, and the blurple accent (the gift icon — the one obvious brand-accent
  // element in this layout). Other chrome stays authentic.
  const bg = ov(clip?.background, "#1E1F22");
  const fg = ov(clip?.color, "#DBDEE1");
  const muted = "#949BA4";
  const iconBg = "#2B2D31";
  const accent = ov(clip?.accent, "#5865F2");
  const fontStack = ov(clip?.fontFamily, DISCORD_STACK);

  const groups = groupByAuthor(messages);

  return (
    <div
      className={cn("flex h-full flex-col", className)}
      style={{ background: bg, color: fg, fontFamily: fontStack }}
    >
      {/* Channel header */}
      <div
        className="flex shrink-0 items-center gap-2 px-3"
        style={{
          background: bg,
          height: 48,
          borderBottom: "1px solid rgba(0,0,0,0.4)",
          zIndex: 2,
        }}
      >
        <button
          type="button"
          aria-label="Back"
          className="flex cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/[0.06]"
          style={{ width: 28, height: 28, color: fg }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            aria-hidden
            fill="none"
          >
            <path
              d="M14 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span style={{ fontSize: 18, color: muted, marginLeft: 2 }}>#</span>
        <span
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: "-0.01em",
          }}
        >
          {title ?? "general"}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          aria-hidden
          fill="none"
          style={{ marginLeft: 2, color: muted }}
        >
          <path
            d="M9 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="flex flex-1" />
        <button
          type="button"
          aria-label="Search"
          className="flex cursor-pointer items-center justify-center rounded-full transition-[filter] duration-150 hover:brightness-125 active:brightness-90"
          style={{ width: 32, height: 32, background: iconBg, color: muted }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            aria-hidden
            fill="none"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="m20 20-4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div
        className="flex flex-1 flex-col overflow-y-auto py-3"
        style={{ scrollbarWidth: "none", gap: 18 }}
      >
        {groups.map((g, gi) => (
          <div key={gi} className="flex gap-3" style={{ padding: "0 12px" }}>
            <div
              className="shrink-0 overflow-hidden rounded-full"
              style={{
                width: 40,
                height: 40,
                background: g.author?.avatar
                  ? undefined
                  : pickColor(g.author?.name ?? ""),
              }}
            >
              <Img
                src={asset(g.author?.avatar) ?? asset(DEFAULT_AVATAR) ?? ""}
                crossOrigin="anonymous"
                alt=""
                style={{ width: 40, height: 40, objectFit: "cover" }}
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-baseline gap-2">
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: g.author?.color ?? "#FFFFFF",
                  }}
                >
                  {g.author?.name ?? "Unknown"}
                </span>
                <span style={{ fontSize: 12, color: muted }}>
                  Today at {g.items[0]?.time ?? ""}
                </span>
              </div>
              <div className="flex flex-col" style={{ gap: 4 }}>
                {g.items.map((m, i) => (
                  <BubbleEnter
                    key={m.id ?? `${gi}-${i}`}
                    enterFrames={m.enterFrames}
                    from={m.from}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        lineHeight: "1.375",
                        color: fg,
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {m.typing ? (
                        <TypingDots color={muted} />
                      ) : (
                        renderDiscordText(m.text ?? "")
                      )}
                    </div>
                  </BubbleEnter>
                ))}
              </div>
              {g.items.some((m) => m.reactions?.length) && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {g.items.flatMap((m) =>
                    (m.reactions ?? []).map((r, ri) => (
                      <span
                        key={`${ri}-${r.emoji}`}
                        className="inline-flex items-center gap-1"
                        style={{
                          padding: "2px 7px",
                          borderRadius: 8,
                          border: "1px solid rgba(88,101,242,0.3)",
                          background: "rgba(88,101,242,0.15)",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#A8B6FF",
                        }}
                      >
                        <span>{r.emoji}</span>
                        {r.count}
                      </span>
                    )),
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Composer — 4 circular buttons + flat pill input + mic, per screenshot */}
      {showComposer && (
        <div
          className="flex shrink-0 items-center gap-2 px-3 pt-2 pb-2"
          style={{ background: bg }}
        >
          <DiscordCircleButton bg={iconBg} fg={fg} label="Add">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              aria-hidden
              fill="none"
            >
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </DiscordCircleButton>
          <DiscordCircleButton bg={iconBg} fg={fg} label="Stickers">
            <DiscordStickerIcon size={20} />
          </DiscordCircleButton>
          <DiscordCircleButton bg={iconBg} fg={accent} label="Gift">
            <DiscordGiftIcon size={20} />
          </DiscordCircleButton>
          <div
            className="flex flex-1 items-center"
            style={{
              background: iconBg,
              borderRadius: 20,
              padding: "0 12px",
              height: 36,
            }}
          >
            <input
              type="text"
              placeholder="Message"
              className="chat-demo-input min-w-0 flex-1 border-0 bg-transparent p-0 outline-none placeholder:text-[#949BA4]"
              style={{
                fontSize: 15,
                color: fg,
                fontFamily: "inherit",
              }}
            />
          </div>
          <DiscordCircleButton bg={iconBg} fg={fg} label="Voice">
            <MicIcon size={18} />
          </DiscordCircleButton>
        </div>
      )}
    </div>
  );
}

function DiscordCircleButton({
  bg,
  fg,
  label,
  children,
}: {
  bg: string;
  fg: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-[filter,opacity] duration-150 hover:brightness-125 active:brightness-90"
      style={{ width: 36, height: 36, background: bg, color: fg }}
    >
      {children}
    </button>
  );
}

function renderDiscordText(text: string) {
  const parts = text.split(/(@\w+|#\w+|`[^`]+`|:\w+:)/g);
  return parts.map((p, i) => {
    if (/^@\w+/.test(p)) {
      return (
        <span
          key={i}
          style={{
            background: "rgba(88,101,242,0.3)",
            color: "#C9CDFB",
            padding: "0 2px",
            borderRadius: 3,
            fontWeight: 500,
          }}
        >
          {p}
        </span>
      );
    }
    if (/^#\w+/.test(p)) {
      return (
        <span key={i} style={{ color: "#00A8FC", fontWeight: 500 }}>
          {p}
        </span>
      );
    }
    if (/^`[^`]+`$/.test(p)) {
      return (
        <code
          key={i}
          style={{
            background: "#2B2D31",
            borderRadius: 3,
            padding: "0 4px",
            fontFamily: '"Menlo", Consolas, monospace',
            fontSize: 13.6,
          }}
        >
          {p.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{p}</span>;
  });
}
