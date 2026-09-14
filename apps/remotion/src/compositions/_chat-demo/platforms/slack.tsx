"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Img } from "remotion";
import { asset } from "../../../lib/asset";
import { BubbleEnter, TypingDots } from "../bubbles";
import { DEFAULT_AVATAR } from "../defaults";
import { type ClipOverrides, ov } from "../overrides";
import { groupByAuthor, pickColor } from "../threads";
import type { ChatMessageItem } from "../types";

const SLACK_STACK =
  '"Slack-Lato", "Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/* =========================================================================
 * Slack
 * ========================================================================= */

export function SlackDemo({
  messages,
  title,
  subtitle,
  showComposer,
  theme,
  className,
  clip,
}: {
  messages: ChatMessageItem[];
  title?: string;
  subtitle?: string;
  showComposer: boolean;
  theme: "light" | "dark";
  className?: string;
  clip?: ClipOverrides;
}) {
  const isDark = theme === "dark";
  // Slack is a channel view (no outgoing bubble), so the universal Style maps
  // background, primary text, and font here. `theme` still decides the default
  // background; a clipStyle override wins when set. Accent has no single clean
  // element in this layout (links/send are Slack blue, per message), so it's
  // left authentic.
  const bg = ov(clip?.background, isDark ? "#1A1D21" : "#FFFFFF");
  const fg = ov(clip?.color, isDark ? "#D1D2D3" : "#1D1C1D");
  const muted = isDark ? "#ABABAD" : "#616061";
  const headerBorder = isDark ? "#2F3236" : "#E8E8E8";
  const fontStack = ov(clip?.fontFamily, SLACK_STACK);

  const groups = groupByAuthor(messages);

  return (
    <div
      className={cn("flex h-full flex-col", className)}
      style={{ background: bg, color: fg, fontFamily: fontStack }}
    >
      <div
        className="flex shrink-0 items-center justify-between border-b px-4"
        style={{ borderColor: headerBorder, height: 56 }}
      >
        <div className="flex flex-col leading-tight">
          <div
            className="flex items-center gap-1"
            style={{ fontWeight: 700, fontSize: 16 }}
          >
            <span style={{ color: muted, fontWeight: 400, marginRight: 2 }}>
              #
            </span>
            {title ?? "general"}
            <svg
              width="12"
              height="12"
              viewBox="0 0 20 20"
              aria-hidden
              style={{ marginLeft: 4 }}
            >
              <path
                d="M5 8l5 5 5-5"
                fill="none"
                stroke={fg}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span style={{ fontSize: 12, color: muted }}>
            {subtitle ?? "Add a topic"}
          </span>
        </div>
        <div className="flex items-center gap-2" style={{ color: muted }}>
          <button
            type="button"
            aria-label="Activity"
            className="flex cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/[0.06]"
            style={{ width: 32, height: 32 }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              aria-hidden
              fill="currentColor"
            >
              <path d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Zm0-2a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm-1-10h2v4h3v2h-5V9Z" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Search"
            className="flex cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/[0.06]"
            style={{ width: 32, height: 32 }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              aria-hidden
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className="flex flex-1 flex-col overflow-y-auto py-3"
        style={{ scrollbarWidth: "none", gap: 12 }}
      >
        {groups.map((g, gi) => (
          <div
            key={gi}
            className="flex items-start gap-2"
            style={{ padding: "0 16px" }}
          >
            <div
              className="shrink-0 overflow-hidden"
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                marginTop: 4,
                background: g.author?.avatar
                  ? undefined
                  : pickColor(g.author?.name ?? ""),
              }}
            >
              <Img
                src={asset(g.author?.avatar) ?? asset(DEFAULT_AVATAR) ?? ""}
                crossOrigin="anonymous"
                alt=""
                style={{ width: 36, height: 36, objectFit: "cover" }}
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-baseline gap-2">
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: 15,
                    color: fg,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {g.author?.name ?? "Unknown"}
                </span>
                <span style={{ fontSize: 12, color: muted }}>
                  {g.items[0]?.time ?? ""}
                </span>
              </div>
              <div className="flex flex-col" style={{ gap: 2 }}>
                {g.items.map((m, i) => (
                  <BubbleEnter
                    key={m.id ?? `${gi}-${i}`}
                    enterFrames={m.enterFrames}
                    from={m.from}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        lineHeight: "22px",
                        color: fg,
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {m.typing ? (
                        <TypingDots color={muted} />
                      ) : (
                        renderSlackText(m.text ?? "", isDark)
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
                          padding: "1px 7px",
                          borderRadius: 12,
                          border: `1px solid ${isDark ? "#3a3d42" : "#DDDDDD"}`,
                          background: isDark ? "#26282C" : "#F1F4F7",
                          fontSize: 12,
                          fontWeight: 700,
                          color: isDark ? "#9DB0CA" : "#1264A3",
                        }}
                      >
                        <span style={{ fontSize: 13 }}>{r.emoji}</span>
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

      {showComposer && (
        <div className="shrink-0 px-3 pt-2 pb-1.5">
          <div
            className="flex flex-col overflow-hidden"
            style={{
              border: `1px solid ${isDark ? "#565856" : "#BABBBC"}`,
              borderRadius: 8,
              background: isDark ? "#222529" : "#fff",
            }}
          >
            {/* Formatting toolbar */}
            <div
              className="flex items-center"
              style={{
                height: 32,
                padding: "0 6px",
                color: muted,
                gap: 2,
                borderBottom: `1px solid ${isDark ? "#3a3d42" : "#E8E8E8"}`,
              }}
            >
              <SlackToolbarButton label="Bold">
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M4 2.75A.75.75 0 0 1 4.75 2h6.343a3.91 3.91 0 0 1 3.88 3.449A2 2 0 0 1 15 5.84l.001.067a3.9 3.9 0 0 1-1.551 3.118A4.627 4.627 0 0 1 11.875 18H4.75a.75.75 0 0 1-.75-.75V9.5a.8.8 0 0 1 .032-.218A.8.8 0 0 1 4 9.065zm2.5 5.565h3.593a2.157 2.157 0 1 0 0-4.315H6.5zm4.25 1.935H6.5v5.5h4.25a2.75 2.75 0 1 0 0-5.5"
                  clipRule="evenodd"
                />
              </SlackToolbarButton>
              <SlackToolbarButton label="Italic">
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M7 2.75A.75.75 0 0 1 7.75 2h7.5a.75.75 0 0 1 0 1.5H12.3l-2.6 13h2.55a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5H7.7l2.6-13H7.75A.75.75 0 0 1 7 2.75"
                  clipRule="evenodd"
                />
              </SlackToolbarButton>
              <SlackToolbarButton label="Underline">
                <path
                  fill="currentColor"
                  d="M17.25 17.12a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5zM14.5 1.63a.75.75 0 0 1 .75.75v8a5.25 5.25 0 1 1-10.5 0v-8a.75.75 0 0 1 1.5 0v8a3.75 3.75 0 0 0 7.5 0v-8a.75.75 0 0 1 .75-.75"
                />
              </SlackToolbarButton>
              <SlackToolbarButton label="Strike">
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M11.721 3.84c-.91-.334-2.028-.36-3.035-.114-1.51.407-2.379 1.861-2.164 3.15C6.718 8.051 7.939 9.5 11.5 9.5l.027.001h5.723a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5h3.66c-.76-.649-1.216-1.468-1.368-2.377-.347-2.084 1.033-4.253 3.265-4.848l.007-.002.007-.002c1.252-.307 2.68-.292 3.915.16 1.252.457 2.337 1.381 2.738 2.874a.75.75 0 0 1-1.448.39c-.25-.925-.91-1.528-1.805-1.856m2.968 9.114a.75.75 0 1 0-1.378.59c.273.64.186 1.205-.13 1.674-.333.492-.958.925-1.82 1.137-.989.243-1.991.165-3.029-.124-.93-.26-1.613-.935-1.858-1.845a.75.75 0 0 0-1.448.39c.388 1.441 1.483 2.503 2.903 2.9 1.213.338 2.486.456 3.79.135 1.14-.28 2.12-.889 2.704-1.753.6-.888.743-1.992.266-3.104"
                  clipRule="evenodd"
                />
              </SlackToolbarButton>
              <SlackToolbarSeparator dark={isDark} />
              <SlackToolbarButton label="Link">
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M12.306 3.756a2.75 2.75 0 0 1 3.889 0l.05.05a2.75 2.75 0 0 1 0 3.889l-3.18 3.18a2.75 2.75 0 0 1-3.98-.095l-.03-.034a.75.75 0 0 0-1.11 1.009l.03.034a4.25 4.25 0 0 0 6.15.146l3.18-3.18a4.25 4.25 0 0 0 0-6.01l-.05-.05a4.25 4.25 0 0 0-6.01 0L9.47 4.47a.75.75 0 1 0 1.06 1.06zm-4.611 12.49a2.75 2.75 0 0 1-3.89 0l-.05-.051a2.75 2.75 0 0 1 0-3.89l3.18-3.179a2.75 2.75 0 0 1 3.98.095l.03.034a.75.75 0 1 0 1.11-1.01l-.03-.033a4.25 4.25 0 0 0-6.15-.146l-3.18 3.18a4.25 4.25 0 0 0 0 6.01l.05.05a4.25 4.25 0 0 0 6.01 0l1.775-1.775a.75.75 0 0 0-1.06-1.06z"
                  clipRule="evenodd"
                />
              </SlackToolbarButton>
              <SlackToolbarButton label="Ordered list">
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M3.792 2.094A.5.5 0 0 1 4 2.5V6h1a.5.5 0 1 1 0 1H2a.5.5 0 1 1 0-1h1V3.194l-.842.28a.5.5 0 0 1-.316-.948l1.5-.5a.5.5 0 0 1 .45.068M7.75 3.5a.75.75 0 0 0 0 1.5h10a.75.75 0 0 0 0-1.5zM7 10.75a.75.75 0 0 1 .75-.75h10a.75.75 0 0 1 0 1.5h-10a.75.75 0 0 1-.75-.75m0 6.5a.75.75 0 0 1 .75-.75h10a.75.75 0 0 1 0 1.5h-10a.75.75 0 0 1-.75-.75m-4.293-3.36a1 1 0 0 1 .793-.39c.49 0 .75.38.75.75 0 .064-.033.194-.173.409a5 5 0 0 1-.594.711c-.256.267-.552.548-.87.848l-.088.084a42 42 0 0 0-.879.845A.5.5 0 0 0 2 18h3a.5.5 0 0 0 0-1H3.242l.058-.055c.316-.298.629-.595.904-.882a6 6 0 0 0 .711-.859c.18-.277.335-.604.335-.954 0-.787-.582-1.75-1.75-1.75a2 2 0 0 0-1.81 1.147.5.5 0 1 0 .905.427 1 1 0 0 1 .112-.184"
                  clipRule="evenodd"
                />
              </SlackToolbarButton>
              <SlackToolbarButton label="Bullet list">
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M4 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a.75.75 0 0 1 .75-.75h10a.75.75 0 0 1 0 1.5h-10A.75.75 0 0 1 7 3m.75 6.25a.75.75 0 0 0 0 1.5h10a.75.75 0 0 0 0-1.5zm0 7a.75.75 0 0 0 0 1.5h10a.75.75 0 0 0 0-1.5zM3 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2"
                  clipRule="evenodd"
                />
              </SlackToolbarButton>
              <SlackToolbarSeparator dark={isDark} />
              <SlackToolbarButton label="Quote">
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M3.5 2.75a.75.75 0 0 0-1.5 0v14.5a.75.75 0 0 0 1.5 0zM6.75 3a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5zM6 10.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H6.75a.75.75 0 0 1-.75-.75m.75 5.25a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5z"
                  clipRule="evenodd"
                />
              </SlackToolbarButton>
              <SlackToolbarButton label="Code">
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M12.058 3.212c.396.12.62.54.5.936L8.87 16.29a.75.75 0 1 1-1.435-.436l3.686-12.143a.75.75 0 0 1 .936-.5M5.472 6.24a.75.75 0 0 1 .005 1.06l-2.67 2.693 2.67 2.691a.75.75 0 1 1-1.065 1.057l-3.194-3.22a.75.75 0 0 1 0-1.056l3.194-3.22a.75.75 0 0 1 1.06-.005m9.044 1.06a.75.75 0 1 1 1.065-1.056l3.194 3.221a.75.75 0 0 1 0 1.057l-3.194 3.219a.75.75 0 0 1-1.065-1.057l2.67-2.69z"
                  clipRule="evenodd"
                />
              </SlackToolbarButton>
              <SlackToolbarButton label="Code block">
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M9.212 2.737a.75.75 0 1 0-1.424-.474l-2.5 7.5a.75.75 0 0 0 1.424.474zm6.038.265a.75.75 0 0 0 0 1.5h2a.25.25 0 0 1 .25.25v11.5a.25.25 0 0 1-.25.25h-13a.25.25 0 0 1-.25-.25v-3.5a.75.75 0 0 0-1.5 0v3.5c0 .966.784 1.75 1.75 1.75h13a1.75 1.75 0 0 0 1.75-1.75v-11.5a1.75 1.75 0 0 0-1.75-1.75zm-3.69.5a.75.75 0 1 0-1.12.996l1.556 1.754-1.556 1.75a.75.75 0 1 0 1.12.997l2-2.249a.75.75 0 0 0 0-.996zM3.999 9.061a.75.75 0 0 1-1.058-.062l-2-2.249a.75.75 0 0 1 0-.996l2-2.252a.75.75 0 1 1 1.12.996L2.504 6.252l1.557 1.75a.75.75 0 0 1-.062 1.059"
                  clipRule="evenodd"
                />
              </SlackToolbarButton>
            </div>

            {/* Text input area */}
            <textarea
              rows={1}
              placeholder={`Message #${title ?? "general"}`}
              className={cn(
                "chat-demo-input resize-none border-0 bg-transparent outline-none",
                isDark
                  ? "placeholder:text-[#ABABAD]"
                  : "placeholder:text-[#616061]",
              )}
              style={{
                padding: "10px 12px",
                fontSize: 15,
                color: fg,
                minHeight: 44,
                lineHeight: "20px",
                fontFamily: "inherit",
              }}
            />

            {/* Footer toolbar */}
            <div
              className="flex items-center justify-between"
              style={{ padding: "0 6px 6px", color: muted }}
            >
              <div className="flex items-center gap-1">
                <SlackToolbarButton label="Attach">
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M10.75 3.25a.75.75 0 0 0-1.5 0v6H3.251L3.25 10v-.75a.75.75 0 0 0 0 1.5V10v.75h6v6a.75.75 0 0 0 1.5 0v-6h6a.75.75 0 0 0 0-1.5h-6z"
                    clipRule="evenodd"
                  />
                </SlackToolbarButton>
                <SlackToolbarButton label="Formatting">
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M6.941 3.952c-.459-1.378-2.414-1.363-2.853.022l-4.053 12.8a.75.75 0 0 0 1.43.452l1.101-3.476h6.06l1.163 3.487a.75.75 0 1 0 1.423-.474zm1.185 8.298L5.518 4.427 3.041 12.25zm6.198-5.537a4.74 4.74 0 0 1 3.037-.081A3.74 3.74 0 0 1 20 10.208V17a.75.75 0 0 1-1.5 0v-.745a8 8 0 0 1-2.847 1.355 3 3 0 0 1-3.15-1.143C10.848 14.192 12.473 11 15.287 11H18.5v-.792c0-.984-.641-1.853-1.581-2.143a3.24 3.24 0 0 0-2.077.056l-.242.089a2.22 2.22 0 0 0-1.34 1.382l-.048.145a.75.75 0 0 1-1.423-.474l.048-.145a3.72 3.72 0 0 1 2.244-2.315zM18.5 12.5h-3.213c-1.587 0-2.504 1.801-1.57 3.085.357.491.98.717 1.572.57a6.5 6.5 0 0 0 2.47-1.223l.741-.593z"
                    clipRule="evenodd"
                  />
                </SlackToolbarButton>
                <SlackToolbarButton label="Emoji">
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M2.5 10a7.5 7.5 0 1 1 15 0 7.5 7.5 0 0 1-15 0M10 1a9 9 0 1 0 0 18 9 9 0 0 0 0-18M7.5 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M14 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m-6.385 3.766a.75.75 0 1 0-1.425.468C6.796 14.08 8.428 15 10.027 15s3.23-.92 3.838-2.766a.75.75 0 1 0-1.425-.468c-.38 1.155-1.38 1.734-2.413 1.734s-2.032-.58-2.412-1.734"
                    clipRule="evenodd"
                  />
                </SlackToolbarButton>
                <SlackToolbarButton label="Mention">
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M2.5 10a7.5 7.5 0 1 1 15 0v.645c0 1.024-.83 1.855-1.855 1.855a1.145 1.145 0 0 1-1.145-1.145V6.75a.75.75 0 0 0-1.494-.098 4.5 4.5 0 1 0 .465 6.212A2.64 2.64 0 0 0 15.646 14 3.355 3.355 0 0 0 19 10.645V10a9 9 0 1 0-3.815 7.357.75.75 0 1 0-.865-1.225A7.5 7.5 0 0 1 2.5 10m7.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6"
                    clipRule="evenodd"
                  />
                </SlackToolbarButton>
                <SlackToolbarButton label="More options">
                  <path
                    fill="currentColor"
                    d="M14.5 10a1.75 1.75 0 1 1 3.5 0 1.75 1.75 0 0 1-3.5 0m-6.25 0a1.75 1.75 0 1 1 3.5 0 1.75 1.75 0 0 1-3.5 0M2 10a1.75 1.75 0 1 1 3.5 0A1.75 1.75 0 0 1 2 10"
                  />
                </SlackToolbarButton>
              </div>
              <div
                className="flex items-stretch overflow-hidden"
                style={{
                  borderRadius: 6,
                  border: `1px solid ${isDark ? "#3a3d42" : "#E1E1E1"}`,
                  color: muted,
                }}
              >
                <button
                  type="button"
                  aria-label="Send"
                  className="flex cursor-pointer items-center justify-center transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                  style={{ width: 24, height: 22, color: muted }}
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden>
                    <path
                      fill="currentColor"
                      d="M1.5 2.106c0-.462.498-.754.901-.528l15.7 7.714a.73.73 0 0 1 .006 1.307L2.501 18.46l-.07.017a.754.754 0 0 1-.931-.733v-4.572c0-1.22.971-2.246 2.213-2.268l6.547-.17c.27-.01.75-.243.75-.797 0-.553-.5-.795-.75-.795l-6.547-.171C2.47 8.95 1.5 7.924 1.5 6.704z"
                    />
                  </svg>
                </button>
                <div
                  style={{
                    width: 1,
                    background: isDark ? "#3a3d42" : "#E1E1E1",
                  }}
                />
                <button
                  type="button"
                  aria-label="Schedule"
                  className="flex cursor-pointer items-center justify-center transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                  style={{ width: 20, height: 22, color: muted }}
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" aria-hidden>
                    <path
                      fill="currentColor"
                      fillRule="evenodd"
                      d="M5.72 7.47a.75.75 0 0 1 1.06 0L10 10.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-3.75 3.75a.75.75 0 0 1-1.06 0L5.72 8.53a.75.75 0 0 1 0-1.06"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SlackToolbarButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex cursor-pointer items-center justify-center rounded transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
      style={{ width: 26, height: 24 }}
    >
      <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden>
        {children}
      </svg>
    </button>
  );
}

function SlackToolbarSeparator({ dark }: { dark: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 1,
        height: 16,
        margin: "0 4px",
        background: dark ? "#3a3d42" : "#E1E1E1",
      }}
    />
  );
}

function renderSlackText(text: string, dark: boolean) {
  const parts = text.split(/(@\w+|#\w+|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (/^@\w+/.test(p)) {
      return (
        <span
          key={i}
          style={{
            background: dark ? "rgba(29,155,209,0.18)" : "#E8F5FA",
            color: dark ? "#1D9BD1" : "#1264A3",
            padding: "1px 3px",
            borderRadius: 3,
            fontWeight: 600,
          }}
        >
          {p}
        </span>
      );
    }
    if (/^#\w+/.test(p)) {
      return (
        <span
          key={i}
          style={{ color: dark ? "#1D9BD1" : "#1264A3", fontWeight: 600 }}
        >
          {p}
        </span>
      );
    }
    if (/^`[^`]+`$/.test(p)) {
      return (
        <code
          key={i}
          style={{
            background: dark ? "#222529" : "#F8F8F8",
            border: `1px solid ${dark ? "#3a3d42" : "#E8E8E8"}`,
            borderRadius: 3,
            padding: "0 4px",
            fontFamily: 'Menlo, Consolas, "Liberation Mono", monospace',
            fontSize: 12,
            color: "#E01E5A",
          }}
        >
          {p.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{p}</span>;
  });
}
