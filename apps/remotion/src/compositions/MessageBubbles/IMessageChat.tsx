"use client";

/**
 * Dedicated iMessage chat renderer for the MessageBubbles composition.
 *
 * This is the iMessage path lifted out of the shared `_chat-demo/ChatDemo.tsx`
 * (a ~3.5k-line file that drives six platforms) into its own focused file, so
 * MessageBubbles' layout — header compression, message grouping/spacing,
 * conversation density — can be tuned here without touching the other five
 * chat compositions and without paying the cost of reading the giant shared
 * file each time.
 *
 * The low-level bubble primitives (CurvedBubble shape, dots→message morph,
 * read receipt, image bubble) are imported from the shared module — they're
 * pixel-identical across platforms and we don't want them to drift. Everything
 * layout-related (the header chrome, the thread column gaps, the grouping
 * rhythm, the composer) lives inline below where it's easy to adjust.
 */

import { cn } from "@workspace/ui/lib/utils";
import { Easing, Img, interpolate } from "remotion";
import { useDesignFrame } from "../../use-design-frame";
import {
  asset,
  BubbleEnter,
  BubbleReveal,
  type ChatMessageItem,
  DotsToMessage,
  IMESSAGE_GRADIENT,
  IMESSAGE_TAIL_ME_COLOR,
  IMESSAGE_THEM_BG_DARK,
  IMESSAGE_THEM_BG_LIGHT,
  ImageBubble,
  ReadReceipt,
  TypingBubble,
} from "../_chat-demo/ChatDemo";
import { CssLiquidGlass } from "../_chat-demo/CssLiquidGlass";
import { Keyboard } from "../_chat-demo/Keyboard";
import { GlassStage } from "../_chat-demo/LiquidGlass";
import { SF_PRO_STACK } from "../_chat-demo/sf-pro";
import { PhotoPicker } from "./PhotoPicker";

/** Shared horizontal inset for the thread AND the composer, so message bubbles
 *  and the input/mic row sit on exactly the same left/right edges. Bumped so the
 *  input box isn't overly wide and the bubbles tuck in to match. */
const CHAT_PAD_X = 36;

type ThreadGroup = { from: "me" | "them"; items: ChatMessageItem[] };

/**
 * Group consecutive same-sender messages into bubble clusters — BUT a message
 * carrying a day divider (`time`) always starts a fresh group, so the divider
 * (e.g. "Today") renders above it even when it continues the same sender. This
 * is how an older conversation reads as separate from a new one.
 */
function groupThread(messages: ChatMessageItem[]): ThreadGroup[] {
  const out: ThreadGroup[] = [];
  for (const m of messages) {
    const from = m.from ?? "them";
    const last = out[out.length - 1];
    if (last && last.from === from && !m.time) last.items.push(m);
    else out.push({ from, items: [m] });
  }
  return out;
}

/**
 * The avatar accepts either an emoji (the default) or an image URL / static
 * path. We treat it as an image only when it looks like one — a URL or a path
 * with a slash or file extension. A bare emoji has neither, so it renders as an
 * emoji on a circle instead.
 */
function isImageAvatar(v: string | undefined): boolean {
  if (!v) return false;
  return /^https?:/i.test(v) || v.includes("/") || v.includes(".");
}

export type IMessageChatProps = {
  messages: ChatMessageItem[];
  title?: string;
  subtitle?: string;
  headerAvatar?: string;
  /** Unread-message count shown as a pill beside the back chevron. 0 hides it. */
  unreadCount?: number;
  showComposer?: boolean;
  className?: string;
  backgroundImage?: string;
  readReceiptTime?: string;
  theme?: "light" | "dark";
  showKeyboard?: boolean;
  composerText?: string;
  pressedKey?: string | null;
  pressT?: number;
  /** Active iMessage attachment-picker flow (drives the + → Photos → grid →
   *  tap animation over the keyboard). Null when not sending a photo. */
  attachment?: { image: string; t: number } | null;
  keyboardOpen?: number;
  /** Logical layout width (px) of the chat column — the design width the chat
   *  is laid out at. Passed to the keyboard so it derives its scale
   *  deterministically instead of measuring the DOM each frame. */
  designWidth?: number;
  /** Extra gallery photos for the attachment picker (besides the sent one). */
  galleryImages?: { name: string; url: string }[];
  /**
   * Universal Style overrides forwarded from the (now unlocked) MessageBubbles
   * composition. Each maps to the one clean slot in the iMessage layout:
   * `clipBackground` → chat sheet, `clipColor` → received-bubble text,
   * `clipFontFamily` → root font, `clipAccent` → the sent (blue) bubble +
   * tail. Unset (empty) means keep the authentic default.
   */
  clipBackground?: string;
  clipColor?: string;
  clipFontFamily?: string;
  clipAccent?: string;
};

/** Use the override if set (non-empty), otherwise the authentic default. */
function ov(value: string | undefined, fallback: string): string {
  return value && value.trim() !== "" ? value : fallback;
}

export function IMessageChat({
  messages,
  title,
  subtitle,
  headerAvatar,
  unreadCount = 0,
  showComposer = true,
  className,
  backgroundImage,
  readReceiptTime,
  theme = "light",
  showKeyboard = false,
  composerText = "",
  pressedKey = null,
  pressT = 0,
  attachment = null,
  keyboardOpen = 1,
  designWidth,
  galleryImages,
  clipBackground,
  clipColor,
  clipFontFamily,
  clipAccent,
}: IMessageChatProps) {
  const grouped = groupThread(messages);
  // Caret blink for the idle (placeholder) composer — a ~1s cycle: on, quick
  // fade out, off, quick fade back in, like the iOS insertion point.
  const frame = useDesignFrame();
  const blinkT = (frame % 60) / 60;
  const caretOpacity =
    blinkT < 0.45
      ? 1
      : blinkT < 0.55
        ? 1 - (blinkT - 0.45) / 0.1
        : blinkT < 0.9
          ? 0
          : (blinkT - 0.9) / 0.1;
  // The read receipt sits under the LAST message you sent and stays there even
  // after they reply — only a newer sent message moves it down. Track that
  // group so the receipt persists across subsequent incoming bubbles.
  let lastMeGroupIndex = -1;
  grouped.forEach((g, i) => {
    if (g.from === "me") lastMeGroupIndex = i;
  });
  const hasBg = !!backgroundImage;
  const hasUnread = Number(unreadCount) > 0;
  // Glass runs with or without a wallpaper. With one it refracts the image;
  // without, it refracts the solid sheet and draws a self-defining adaptive
  // edge so the buttons/composer still read as liquid glass.
  // WebGL liquid glass is intentionally dropped for MessageBubbles: it was the
  // main render-vs-preview mismatch and the biggest per-frame cost, and over a
  // dark sheet its refraction is barely visible. The chrome still reads as glass
  // via the flat translucent CssLiquidGlass fills below — those render
  // identically in the studio Player and in the export. GlassStage stays only as
  // a plain backdrop + wallpaper layer (enabled={false} = no WebGL).
  const glassOn = false;
  const dark = theme === "dark";

  // Photo attachment in the composer. Only AFTER the gallery photo is tapped and
  // its "1" badge has popped (PhotoPicker, photoTap ends ~t 0.72) does the photo
  // drop into the input pill: the pill grows and the photo RISES into it with a
  // gentle bounce. It then sits visibly in the composer before the send (~t
  // 0.94→1) collapses the pill and the real photo bubble lands in the thread.
  // These windows MUST start after PhotoPicker's photoTap so the photo never
  // appears in the composer before it's been selected.
  const attachT = attachment?.t ?? 0;
  // Pill grows smoothly to fit the photo (clean expand, no height wobble).
  const grow = interpolate(attachT, [0.61, 0.71], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  // Fade-in as it's added.
  const fadeIn = interpolate(attachT, [0.61, 0.68], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Gentle settle as it appears in the input (stays CONTAINED in the pill).
  const riseIn = interpolate(attachT, [0.61, 0.7, 0.76], [16, -3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  // Send: the input preview just fades + the pill collapses IN PLACE (the photo
  // never leaves the input). The actual "slide up" happens on the message
  // bubble in the thread, not here.
  const sendT = interpolate(attachT, [0.86, 0.98], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const showAttach = Boolean(attachment) && attachT >= 0.6 && sendT < 1;
  // Preview size (design px) — a large, slightly-portrait photo card like the
  // real iMessage composer preview (not a tiny thumbnail).
  const THUMB_W = 120;
  const THUMB_H = 146;
  // Outer box height drives the pill's grow/collapse; the photo inside stays
  // clipped to it (contained).
  const attachBoxH = THUMB_H * grow * (1 - sendT);
  const photoY = riseIn;
  const photoOpacity = fadeIn * (1 - sendT);

  // The chat sheet (when there's no wallpaper) follows the appearance — or the
  // universal background override when one is set.
  const sheetBg = ov(clipBackground, dark ? "#000000" : "#ffffff");
  // Chrome text/icons go light over a wallpaper OR in dark mode.
  const lightUI = hasBg || dark;
  const headerText = lightUI ? "#ffffff" : "#000000";
  // Received bubbles use Apple's exact grays per appearance; their text follows
  // the universal text override. Sent bubbles use the universal accent (default
  // iMessage blue) for both the fill and the tail.
  const themText = ov(clipColor, dark ? "#ffffff" : "#000000");
  const themBubbleBg = dark ? IMESSAGE_THEM_BG_DARK : IMESSAGE_THEM_BG_LIGHT;
  const sentBg = ov(clipAccent, IMESSAGE_GRADIENT);
  const sentTail = ov(clipAccent, IMESSAGE_TAIL_ME_COLOR);
  const fontStack = ov(clipFontFamily, SF_PRO_STACK);
  // The header/composer strips must NOT paint an opaque sheet color over the
  // WebGL glass canvas, or the glass chrome (buttons, name chip, composer pill)
  // is buried and only the bare icons show. Whenever glass is on we keep the
  // strips transparent so the canvas — drawn over the GlassStage's own solid
  // backdrop (sheetBg) — shows through. Only the plain, non-glass mode paints
  // the sheet color here.
  const chromeBg = hasBg || glassOn ? "transparent" : sheetBg;
  const chipBg = hasBg
    ? "rgba(120,120,128,0.42)"
    : dark
      ? "rgba(120,120,128,0.32)"
      : "#E9E9EB";
  // Glass chrome (back/FaceTime/plus buttons + name chip). Over a wallpaper the
  // WebGL layer refracts the image; over a solid sheet there's nothing to
  // refract, so we render a real frosted CSS pill — a translucent light fill
  // that lifts off the dark sheet, a bright top rim + soft inner/outer shadow
  // (the Apple "liquid glass" bezel), and a blur. `forceCss` (passed below when
  // there's no wallpaper) keeps this look instead of the flat shader shape.
  const chromeGlassStyle: React.CSSProperties = hasBg
    ? {
        background: chipBg,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }
    : dark
      ? {
          // Clean, lucent glass: a barely-there fill so the BLURRED backdrop
          // (bubbles) shows through clear like water — not a milky white or a
          // flat gray pill. Saturate (in the backdrop filter) keeps it vivid;
          // a thin bright rim is the only solid edge.
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow:
            "inset 0 1px 0.5px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(255,255,255,0.06)",
        }
      : {
          // Light theme: a frosted GRAY material so the pill is visible on the
          // white sheet (white-on-white was invisible), with a thin dark hairline
          // + soft drop shadow for lift and a bright top rim.
          background: "rgba(140,140,150,0.16)",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow:
            "inset 0 1px 0.5px rgba(255,255,255,0.7), 0 1px 2px rgba(0,0,0,0.08)",
        };
  // Back/FaceTime icons go white whenever the surface behind them is dark — a
  // wallpaper or dark appearance — so they read on the translucent glass. On a
  // plain light sheet they stay the iOS blue accent (white would vanish).
  const iconColor = lightUI ? "#ffffff" : "#0a84ff";
  const groupTimeColor = lightUI
    ? "rgba(255,255,255,0.85)"
    : "rgba(60,60,67,0.6)";
  const receiptColor = lightUI
    ? "rgba(235,235,245,0.55)"
    : "rgba(60,60,67,0.5)";

  return (
    <GlassStage
      enabled={glassOn}
      bgImage={backgroundImage}
      bgColor={sheetBg}
      className={cn("h-full", className)}
      style={{ fontFamily: fontStack }}
    >
      <div className="relative flex h-full flex-col">
        {/* Subtle top darkness — a soft top-down gradient sitting ABOVE the
            messages but BELOW the header chrome (z-10 < header z-20), so the
            thread fades under the status bar + avatar/icons like real iMessage.
            Invisible over the plain dark sheet; it only darkens bubbles that
            scroll up beneath the header. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 150,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0))",
            zIndex: 10,
            pointerEvents: "none",
          }}
        />
        {/* Header — back chevron + avatar/name chip + FaceTime, glass chrome.
            Absolutely overlaid so the thread scrolls UNDERNEATH it (like real
            iMessage) instead of being hard-cut by an opaque bar. */}
        <div
          className="absolute inset-x-0 top-0 z-20 flex flex-col items-center justify-center"
          // No background fill — the chrome (buttons / avatar / name) floats over
          // the messages like real iMessage; the thread's own subtle top mask is
          // all that softens the edge. A solid/large fill here re-introduces the
          // dark band that swallows the top messages.
          style={{ background: "transparent", padding: "44px 16px 12px" }}
        >
          <div style={{ position: "absolute", left: 24, top: 56 }}>
            <CssLiquidGlass
              radius={20}
              style={{
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // With an unread badge the button grows into a pill (chevron +
                // count); without one it stays a 40×40 circle.
                gap: hasUnread ? 5 : 0,
                width: hasUnread ? "auto" : 40,
                padding: hasUnread ? "0 7px 0 12px" : 0,
                color: iconColor,
              }}
              glassStyle={chromeGlassStyle}
            >
              <svg
                width="13"
                height="22"
                viewBox="0 0 12 20"
                fill="none"
                aria-hidden
              >
                <path
                  d="M9 2 2 10l7 8"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {hasUnread && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 23,
                    height: 23,
                    padding: "0 6px",
                    borderRadius: 9999,
                    // White count pill with dark text, like iMessage's unread
                    // badge on the back button.
                    background: "#ffffff",
                    color: "#1c1c1e",
                    fontSize: 13,
                    fontWeight: 400,
                    letterSpacing: "-0.01em",
                    lineHeight: 1,
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </CssLiquidGlass>
          </div>

          <div style={{ position: "absolute", right: 24, top: 56 }}>
            <CssLiquidGlass
              radius={20}
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: iconColor,
              }}
              glassStyle={chromeGlassStyle}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <rect
                  x="2.5"
                  y="6.5"
                  width="12"
                  height="11"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 10.2l5.2-3.1c.5-.3 1.1.06 1.1.64v8.5c0 .58-.6.94-1.1.64L15 13.8z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </CssLiquidGlass>
          </div>

          <div
            className="overflow-hidden rounded-full"
            style={{
              width: 64,
              height: 64,
              // Tuck the name chip up under the avatar so it overlaps the bottom
              // edge (avatar sits in front via zIndex), like the reference.
              marginBottom: -9,
              position: "relative",
              zIndex: 1,
              // Soft drop shadow so the avatar lifts off the sheet (3D feel).
              // (overflow:hidden clips the content to a circle but not this
              // outer shadow.)
              boxShadow: "0 3px 9px rgba(0,0,0,0.3)",
            }}
          >
            {isImageAvatar(headerAvatar) ? (
              <Img
                src={asset(headerAvatar) ?? ""}
                crossOrigin="anonymous"
                alt=""
                style={{ width: 64, height: 64, objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 30,
                  lineHeight: 1,
                  // Domed "sphere" look like the reference: a warm cream radial
                  // gradient lit from the top-left, plus a bright inner top rim
                  // and a soft inner bottom shadow for real depth. The emoji
                  // gets a faint shadow so it sits ON the dome rather than
                  // looking pasted flat.
                  background:
                    "radial-gradient(125% 125% at 32% 24%, #fef5e7 0%, #f6dcba 52%, #e6bf90 100%)",
                  boxShadow:
                    "inset 0 2px 2.5px rgba(255,255,255,0.85), inset 0 -5px 9px rgba(120,80,30,0.2)",
                  textShadow: "0 1px 1.5px rgba(0,0,0,0.18)",
                }}
              >
                {headerAvatar || "🙂"}
              </div>
            )}
          </div>

          <CssLiquidGlass
            radius={19}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "11px 14px 8px",
              color: headerText,
              fontSize: 13,
              fontWeight: 600,
              position: "relative",
              zIndex: 0,
            }}
            glassStyle={chromeGlassStyle}
          >
            <span style={{ letterSpacing: "-0.01em", lineHeight: 1 }}>
              {title ?? "GAIA"}
            </span>
            <svg
              width="5"
              height="8"
              viewBox="0 0 7 11"
              fill="none"
              aria-hidden
              style={{ display: "block", flexShrink: 0 }}
            >
              <path
                d="M1 1l4.5 4.5L1 10"
                stroke={lightUI ? "#B0B0B6" : "#8E8E93"}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </CssLiquidGlass>

          {subtitle && (
            <span
              style={{
                fontSize: 11,
                color: hasBg ? "rgba(255,255,255,0.7)" : "rgba(60,60,67,0.55)",
                marginTop: 3,
              }}
            >
              {subtitle}
            </span>
          )}
        </div>

        <div
          className="relative z-0 flex flex-1 flex-col overflow-y-auto pb-3"
          style={{
            scrollbarWidth: "none",
            // Horizontal padding kept IDENTICAL to the composer below (CHAT_PAD_X)
            // so bubble edges line up exactly with the + button / mic — same
            // column, not different insets.
            paddingLeft: CHAT_PAD_X,
            paddingRight: CHAT_PAD_X,
            // Subtle top-edge fade so messages near the top gently dissolve
            // (the convo "continues beyond" the screen) instead of hard-cutting.
            // A gentle two-stop curve — barely-there until ~30px, fully gone by
            // ~95px — so it reads as a soft edge, not a dark wash. NOTE: design
            // px (the thread is scaled up ~2.8× for 1080p), so this is ~265px on
            // screen. True opacity mask: background-agnostic, survives export.
            maskImage:
              "linear-gradient(to bottom, transparent 0, rgba(0,0,0,0.55) 46px, black 130px)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0, rgba(0,0,0,0.55) 46px, black 130px)",
            // Gap BETWEEN groups = a sender change. A bit more air than the
            // tight same-sender cluster gap below, so blue↔gray read as distinct
            // turns (matching the reference) without drifting far apart.
            gap: 5,
            // Anchor the thread to the bottom; older bubbles scroll up UNDER the
            // overlaid header and fade into the scrim. The newest bubble sits
            // just above the composer.
            justifyContent: "flex-end",
          }}
        >
          {grouped.map((group, gi) => {
            const groupTime = group.items[0]?.time;
            return (
              <div key={gi} className="flex flex-col" style={{ gap: 4 }}>
                {groupTime && (
                  <div
                    className="self-center text-center"
                    style={{
                      fontSize: 11,
                      color: groupTimeColor,
                      fontWeight: 500,
                      letterSpacing: "-0.01em",
                      marginTop: gi === 0 ? 4 : 6,
                    }}
                  >
                    {groupTime}
                  </div>
                )}
                <div
                  className={cn(
                    "flex flex-col",
                    group.from === "me" ? "items-end" : "items-start",
                  )}
                  // Same-sender burst: bubbles cluster tight, like iMessage.
                  style={{ gap: 2 }}
                >
                  {group.items.map((m, i) => {
                    const isLast = i === group.items.length - 1;
                    const isMe = group.from === "me";
                    // iMessage grouping: flatten the tail-side corner where this
                    // bubble meets a same-sender neighbour in the run.
                    const topGrouped = i > 0;
                    const bottomGrouped = !isLast;
                    return (
                      <BubbleEnter
                        key={m.id ?? `${gi}-${i}`}
                        enterFrames={m.enterFrames}
                        from={group.from}
                        // Sent photos slide up into the thread instead of
                        // ballooning from the tail corner.
                        slideUp={Boolean(m.image) && !m.typing}
                      >
                        {m.image ? (
                          // Photos can't morph from dots like text — keep the
                          // scale-from-tail reveal once the typing phase ends.
                          <BubbleReveal
                            revealFrames={m.typing ? undefined : m.revealFrames}
                            from={group.from}
                          >
                            {m.typing ? (
                              <TypingBubble
                                from={group.from}
                                background={isMe ? sentBg : themBubbleBg}
                                tailColor={isMe ? sentTail : themBubbleBg}
                                color={isMe ? "#fff" : themText}
                                dotsColor={
                                  isMe ? "rgba(255,255,255,0.9)" : "#8e8e93"
                                }
                              />
                            ) : (
                              <ImageBubble
                                src={m.image}
                                from={group.from}
                                tail={isLast}
                              />
                            )}
                          </BubbleReveal>
                        ) : (
                          <DotsToMessage
                            from={group.from}
                            tail={isLast}
                            background={isMe ? sentBg : themBubbleBg}
                            tailColor={isMe ? sentTail : themBubbleBg}
                            color={isMe ? "#fff" : themText}
                            dotsColor={
                              isMe ? "rgba(255,255,255,0.9)" : "#8e8e93"
                            }
                            text={m.text}
                            typing={!!m.typing}
                            revealFrames={m.revealFrames}
                            topGrouped={topGrouped}
                            bottomGrouped={bottomGrouped}
                          />
                        )}
                      </BubbleEnter>
                    );
                  })}
                  {gi === lastMeGroupIndex &&
                    (() => {
                      const last = group.items[group.items.length - 1];
                      if (!last || last.typing) return null;
                      return (
                        <ReadReceipt
                          enterFrames={last.enterFrames ?? 0}
                          color={receiptColor}
                          time={readReceiptTime}
                        />
                      );
                    })()}
                </div>
              </div>
            );
          })}
        </div>

        {(showComposer || showKeyboard) && (
          <div
            className="flex shrink-0 items-end gap-3.5 pt-2 pb-1.5"
            style={{
              background: chromeBg,
              paddingLeft: CHAT_PAD_X,
              paddingRight: CHAT_PAD_X,
            }}
          >
            <CssLiquidGlass
              radius={17}
              style={{
                width: 34,
                height: 34,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: lightUI ? "#ffffff" : "rgba(60,60,67,0.7)",
              }}
              glassStyle={chromeGlassStyle}
            >
              <svg width="16" height="16" viewBox="0 0 14 14" aria-hidden>
                <path
                  d="M7 1v12M1 7h12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </CssLiquidGlass>
            <CssLiquidGlass
              radius={18}
              style={{
                display: "flex",
                flex: 1,
                // Column so a photo attachment can stack above the input row and
                // grow the pill; the input row itself stays bottom-aligned.
                flexDirection: "column",
                alignItems: "stretch",
                justifyContent: "flex-end",
                gap: showAttach ? 7 : 0,
                padding: "5px 8px 5px 16px",
                minHeight: 36,
              }}
              glassStyle={
                hasBg
                  ? {
                      background: "rgba(40,40,44,0.45)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                    }
                  : dark
                    ? {
                        // Clean, lucent glass to match the chrome — barely-there
                        // fill so the blurred backdrop shows through clear, with
                        // a thin bright rim. Not milky, not gray.
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        boxShadow: "inset 0 1px 0.5px rgba(255,255,255,0.18)",
                      }
                    : {
                        // Light theme: visible frosted gray (white-on-white was
                        // invisible), thin dark hairline + soft shadow for lift.
                        background: "rgba(140,140,150,0.16)",
                        border: "1px solid rgba(0,0,0,0.06)",
                        boxShadow:
                          "inset 0 1px 0.5px rgba(255,255,255,0.7), 0 1px 2px rgba(0,0,0,0.08)",
                      }
              }
            >
              {/* Photo attachment preview — the pill grows (attachBoxH) and the
                  photo RISES into it (bottom-anchored, clipped) with a gentle
                  bounce. On send it slides UP out of the input, the box
                  collapses, and it fades. */}
              {showAttach && attachment ? (
                <div
                  style={{
                    position: "relative",
                    alignSelf: "flex-start",
                    width: THUMB_W,
                    height: attachBoxH,
                    marginTop: 2,
                    // Contained: the photo stays inside the input pill (clipped),
                    // it never escapes over the messages. The slide-up belongs to
                    // the sent bubble, not this preview.
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      width: THUMB_W,
                      height: THUMB_H,
                      transform: `translateY(${photoY}px)`,
                      opacity: photoOpacity,
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 16,
                        overflow: "hidden",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.45)",
                      }}
                    >
                      <Img
                        src={asset(attachment.image) ?? ""}
                        crossOrigin="anonymous"
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    {/* ✕ remove badge — inset in the photo's top-right corner */}
                    <div
                      style={{
                        position: "absolute",
                        top: 7,
                        right: 7,
                        width: 22,
                        height: 22,
                        borderRadius: 9999,
                        background: "rgba(0,0,0,0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        aria-hidden
                      >
                        <path
                          d="M2 2l6 6M8 2l-6 6"
                          stroke="#fff"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : null}
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                }}
              >
                <div
                  className="min-w-0 flex-1"
                  style={{
                    fontSize: 15,
                    letterSpacing: "-0.01em",
                    lineHeight: "20px",
                    textAlign: "left",
                    // Wrap long messages onto new lines (grows the field) instead
                    // of clipping/scrolling in one line.
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    // Nudge so single-line text sits centered against the
                    // bottom-aligned send button.
                    paddingBottom: 3,
                  }}
                >
                  {composerText ? (
                    <span style={{ color: lightUI ? "#ffffff" : "#000" }}>
                      {composerText}
                      <span
                        aria-hidden
                        style={{
                          display: "inline-block",
                          width: 1.5,
                          height: 17,
                          marginLeft: 1,
                          marginBottom: -3,
                          background: "#0a84ff",
                          borderRadius: 1,
                        }}
                      />
                    </span>
                  ) : showAttach ? (
                    // With a photo attached, the placeholder becomes the iMessage
                    // "Add comment or Send" prompt (no blinking caret).
                    <span
                      style={{
                        color: lightUI
                          ? "rgba(235,235,245,0.32)"
                          : "rgba(60,60,67,0.38)",
                      }}
                    >
                      Add comment or Send
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        verticalAlign: "middle",
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          display: "inline-block",
                          width: 1.5,
                          height: 17,
                          marginRight: 4,
                          background: "#0a84ff",
                          borderRadius: 1,
                          opacity: caretOpacity,
                        }}
                      />
                      <span
                        style={{
                          color: lightUI
                            ? "rgba(235,235,245,0.32)"
                            : "rgba(60,60,67,0.38)",
                        }}
                      >
                        Message
                      </span>
                    </span>
                  )}
                </div>
                {composerText || showAttach ? (
                  <button
                    type="button"
                    aria-label="Send"
                    className="ml-2 flex shrink-0 cursor-pointer items-center justify-center rounded-full"
                    style={{ width: 26, height: 26, background: "#0a84ff" }}
                  >
                    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
                      <path
                        d="M8 13V3M8 3 3.5 7.5M8 3l4.5 4.5"
                        stroke="#fff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label="Audio"
                    className="ml-2 flex cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/[0.06]"
                    style={{
                      color: lightUI
                        ? "rgba(255,255,255,0.85)"
                        : "rgba(60,60,67,0.7)",
                      width: 22,
                      height: 22,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                      <path
                        d="M8 1.5a2 2 0 0 0-2 2v4a2 2 0 0 0 4 0v-4a2 2 0 0 0-2-2Zm4 6a4 4 0 0 1-8 0H3a5 5 0 0 0 4.5 5V14h1v-1.5A5 5 0 0 0 13 7.5h-1Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </CssLiquidGlass>
          </div>
        )}

        {showKeyboard && (
          <div
            style={{
              flexShrink: 0,
              // Breathing room between the composer and the keyboard.
              marginTop: 6,
              // Clip the slide-up at the bottom/sides, but allow upward overflow
              // for the key-press pop balloon AND the attachment menu card (which
              // grows up out of the + over the messages).
              clipPath: "inset(-520px 0 0 0)",
            }}
          >
            <div
              style={{
                position: "relative",
                transform: `translateY(${(1 - keyboardOpen) * 100}%)`,
                willChange: "transform",
              }}
            >
              <Keyboard
                theme={theme}
                pressedKey={pressedKey}
                pressT={pressT}
                width={designWidth}
                fontFamily={SF_PRO_STACK}
              />
              {/* When a photo is being sent, the attachment picker overlays the
                  keyboard slot (no layout jump): + menu → Photos → grid → tap. */}
              {attachment && (
                <PhotoPicker
                  image={attachment.image}
                  t={attachment.t}
                  theme={theme}
                  galleryImages={galleryImages}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </GlassStage>
  );
}
