"use client";

import {
  BubbleChatIcon,
  Delete02Icon,
  DragDropVerticalIcon,
  ImageAdd02Icon,
  MoreHorizontalIcon,
  Sent02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import { useEffect, useRef, useState } from "react";
import type { EditorProps } from "../schema";
import type { ChatMessage } from "./types";

const FIRST_DELAY = 30;
// Gap after each message before the next starts. This is the conversation's
// pace: 90 (1.5s) felt too slow/draggy, so messages now follow each other at a
// natural texting rhythm (~0.7s).
const GAP_FRAMES = 42;

function computeTypingFrames(m: ChatMessage): number {
  // A photo runs the full + → menu → grid → select → send attachment flow, so
  // it needs a real window (~2s at 60fps) — not the short "..." beat a text
  // message gets, or the whole sequence flashes by in well under a second.
  if (m.image) return 120;
  return Math.max(45, Math.min(90, Math.round(m.text.length * 3.5)));
}

function recomputeTimings(messages: ChatMessage[]): ChatMessage[] {
  let cursor = FIRST_DELAY;
  return messages.map((m) => {
    // History messages are already on screen from frame 0 — they don't animate
    // and MUST NOT consume the timeline, or every history bubble adds dead air
    // at the start (the first animated message ends up delayed by the sum of all
    // history "typing" windows + gaps). Zero them out and leave the cursor put.
    if (m.history) return { ...m, typingFrames: 0, delay: 0 };
    const typingFrames = computeTypingFrames(m);
    const delay = cursor;
    cursor = delay + typingFrames + GAP_FRAMES;
    return { ...m, typingFrames, delay };
  });
}

/** Fixed label for the single conversation divider (not user-editable). */
const DIVIDER_LABEL = "Today";

/**
 * The "Today" divider splits the thread: messages ABOVE it are history (already
 * on screen from frame 0), messages BELOW animate in. Its index is the first
 * message carrying the divider label, falling back to the count of leading
 * history messages (so an imported/legacy project still resolves a position).
 */
function computeDividerIndex(messages: ChatMessage[]): number {
  const labelled = messages.findIndex((m) => m.time != null);
  if (labelled >= 0) return labelled;
  let k = 0;
  while (k < messages.length && messages[k]?.history) k++;
  return k;
}

/**
 * Re-stamp the divider invariant onto the list: messages [0,k) are history,
 * [k,n) animate, and only message k carries the fixed "Today" label. Run after
 * every edit so the divider stays a clean prefix split however messages are
 * added, deleted, or reordered around it.
 */
function applyDivider(messages: ChatMessage[], k: number): ChatMessage[] {
  const clamped = Math.max(0, Math.min(k, messages.length));
  return messages.map((m, i) => ({
    ...m,
    history: i < clamped ? true : undefined,
    time: i === clamped && i < messages.length ? DIVIDER_LABEL : undefined,
  }));
}

export function ChatEditor({ value, onChange }: EditorProps<ChatMessage[]>) {
  const [draft, setDraft] = useState("");
  // Drag-to-reorder state. `dragIndex` is the row being dragged; `dropGap` is
  // the insertion slot (0…n) the drop line is currently showing.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropGap, setDropGap] = useState<number | null>(null);
  // What's currently being dragged: a message row (reorder) or the "Today"
  // divider (re-split history/animated). Both share the dropGap hover preview.
  const [dragKind, setDragKind] = useState<"row" | "divider" | null>(null);
  const [fileOver, setFileOver] = useState(false);
  // The side the composer sends as. The user picks it (You / Them) — it no
  // longer auto-alternates, so you can send several in a row from the same side.
  const [side, setSide] = useState<ChatMessage["side"]>("right");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prevLength = useRef(value.length);
  useEffect(() => {
    if (value.length > prevLength.current && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    prevLength.current = value.length;
  }, [value.length]);

  // Current divider position, derived from the data each render. Messages
  // [0, dividerIndex) are history; [dividerIndex, n) animate in.
  const dividerIndex = computeDividerIndex(value);

  // Every mutation funnels through here: re-stamp the divider split, then
  // recompute the frame timings, then push up. `dividerK` lets a mutation move
  // the divider (drag) or keep it put (everything else).
  function commit(next: ChatMessage[], dividerK: number) {
    onChange(recomputeTimings(applyDivider(next, dividerK)));
  }

  function addMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    // New messages append below the divider (they animate in). Divider stays.
    commit(
      [...value, { text: trimmed, side, typingFrames: 0, delay: 0 }],
      dividerIndex,
    );
    setDraft("");
  }

  function addImage(dataUrl: string) {
    commit(
      [...value, { text: "", side, image: dataUrl, typingFrames: 0, delay: 0 }],
      dividerIndex,
    );
  }

  function patchMessage(i: number, patch: Partial<ChatMessage>) {
    const next = value.slice();
    next[i] = { ...next[i]!, ...patch };
    commit(next, dividerIndex);
  }

  function deleteMessage(i: number) {
    const next = value.slice();
    next.splice(i, 1);
    // Deleting a history message shifts the divider up by one.
    commit(next, i < dividerIndex ? dividerIndex - 1 : dividerIndex);
  }

  function flipSide(i: number) {
    const cur = value[i]!;
    patchMessage(i, { side: cur.side === "left" ? "right" : "left" });
  }

  /** Auto-delete a bubble the moment it's left empty (no text, no image). */
  function pruneIfEmpty(i: number) {
    const m = value[i];
    if (m && !m.image && !m.text.trim()) deleteMessage(i);
  }

  function reorder(from: number, gap: number) {
    const next = value.slice();
    const [item] = next.splice(from, 1);
    if (!item) return;
    const target = from < gap ? gap - 1 : gap;
    next.splice(target, 0, item);
    // The divider is a fixed slot: messages dragged above it become history,
    // below it animate. So keep the same numeric position.
    commit(next, dividerIndex);
  }

  /** Move the "Today" divider to a new slot (history above, animated below). */
  function setDivider(k: number) {
    commit(value, k);
  }

  function onFiles(files: FileList | null) {
    const images = Array.from(files ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    for (const file of images) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") addImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function resetDrag() {
    setDragIndex(null);
    setDropGap(null);
    setDragKind(null);
  }

  function handleDrop() {
    if (dropGap !== null) {
      if (dragKind === "divider") setDivider(dropGap);
      else if (dragIndex !== null) reorder(dragIndex, dropGap);
    }
    resetDrag();
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-background"
      style={{ ["--imessage-bg" as string]: "var(--background)" }}
    >
      <div
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-y-auto transition-shadow",
          fileOver && "ring-2 ring-inset ring-[#007AFF]",
        )}
        onDragOver={(e) => {
          if (Array.from(e.dataTransfer.types).includes("Files")) {
            e.preventDefault();
            setFileOver(true);
          }
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node))
            setFileOver(false);
        }}
        onDrop={(e) => {
          if (e.dataTransfer.files?.length) {
            e.preventDefault();
            onFiles(e.dataTransfer.files);
          }
          setFileOver(false);
        }}
      >
        {fileOver && (
          <div className="pointer-events-none sticky top-0 z-10 flex items-center justify-center gap-1.5 bg-[#007AFF]/10 py-1.5 text-[11px] font-medium text-[#007AFF]">
            Drop photo to add it to the conversation
          </div>
        )}
        {value.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            className="px-3 py-5"
            // Make the ENTIRE list a valid drop zone. A native drop only fires
            // where dragover called preventDefault; without this you could only
            // release the divider/row precisely over a message row (gaps, drop
            // lines and the divider chip rejected it, so it snapped back). The
            // precise target gap is still whatever row was last hovered.
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => {
              // Only clear when truly leaving the list, not on child enter.
              if (!e.currentTarget.contains(e.relatedTarget as Node))
                setDropGap(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop();
            }}
          >
            {value.map((m, i) => (
              <div key={i}>
                <DropLine active={dropGap === i} />
                {i === dividerIndex && (
                  <TodayDivider
                    index={i}
                    dragging={dragKind === "divider"}
                    onDragStart={() => {
                      setDragKind("divider");
                      setDragIndex(null);
                    }}
                    onDragEnd={resetDrag}
                    onHoverGap={(gap) => setDropGap(gap)}
                  />
                )}
                <BubbleRow
                  msg={m}
                  index={i}
                  dragging={dragIndex === i}
                  isHistory={i < dividerIndex}
                  onText={(text) => patchMessage(i, { text })}
                  onBlurEmpty={() => pruneIfEmpty(i)}
                  onFlip={() => flipSide(i)}
                  onDelete={() => deleteMessage(i)}
                  onDragStart={() => {
                    setDragKind("row");
                    setDragIndex(i);
                  }}
                  onDragEnd={resetDrag}
                  onHoverGap={(gap) => setDropGap(gap)}
                />
              </div>
            ))}
            {/* Divider can also sit at the very bottom (everything is history). */}
            {dividerIndex >= value.length && (
              <TodayDivider
                index={value.length}
                dragging={dragKind === "divider"}
                onDragStart={() => {
                  setDragKind("divider");
                  setDragIndex(null);
                }}
                onDragEnd={resetDrag}
                onHoverGap={(gap) => setDropGap(gap)}
              />
            )}
            <DropLine active={dropGap === value.length} />
          </div>
        )}
      </div>

      <Composer
        draft={draft}
        side={side}
        onSideChange={setSide}
        onDraftChange={setDraft}
        onSend={() => addMessage(draft)}
        onPickFiles={onFiles}
      />
    </div>
  );
}

function DropLine({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        "mx-2 my-1 h-0.5 rounded-full transition-all duration-100",
        active ? "bg-[#007AFF]" : "bg-transparent",
      )}
    />
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <HugeiconsIcon
          icon={BubbleChatIcon}
          size={24}
          className="text-muted-foreground"
        />
      </div>
      <div>
        <p className="text-sm font-medium">No messages yet</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Type below or attach a photo. Drag the handle to reorder.
        </p>
      </div>
    </div>
  );
}

function BubbleRow({
  msg,
  index,
  dragging,
  isHistory,
  onText,
  onBlurEmpty,
  onFlip,
  onDelete,
  onDragStart,
  onDragEnd,
  onHoverGap,
}: {
  msg: ChatMessage;
  index: number;
  dragging: boolean;
  isHistory: boolean;
  onText: (t: string) => void;
  onBlurEmpty: () => void;
  onFlip: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onHoverGap: (gap: number) => void;
}) {
  const isRight = msg.side === "right";
  return (
    <div
      className={cn(
        "group flex w-full items-center gap-1.5 transition-opacity",
        dragging && "opacity-40",
        // History (above the divider) reads dimmed — it's already on screen at
        // frame 0 and doesn't animate.
        !dragging && isHistory && "opacity-55",
      )}
      onDragOver={(e) => {
        // Reordering is in progress (a row sets dataTransfer); pick the gap by
        // which half of this row the cursor is over.
        e.preventDefault();
        const r = e.currentTarget.getBoundingClientRect();
        const before = e.clientY < r.top + r.height / 2;
        onHoverGap(before ? index : index + 1);
      }}
    >
      {/* Drag handle — only this initiates the native drag, so the textarea
          stays freely editable. */}
      <button
        type="button"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", String(index));
          onDragStart();
        }}
        onDragEnd={onDragEnd}
        title="Drag to reorder"
        className="flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground/50 opacity-0 transition-opacity hover:bg-muted hover:text-muted-foreground active:cursor-grabbing group-hover:opacity-100"
      >
        <HugeiconsIcon icon={DragDropVerticalIcon} size={16} />
      </button>

      <div
        className="transition-[flex-grow] duration-300 ease-out"
        style={{ flexGrow: isRight ? 1 : 0, flexShrink: 0, flexBasis: 0 }}
        aria-hidden
      />

      {isRight && <RowActions onDelete={onDelete} />}

      {msg.image ? (
        <ImageBubbleEditor src={msg.image} isRight={isRight} onFlip={onFlip} />
      ) : (
        <BubbleBody
          msg={msg}
          isRight={isRight}
          onText={onText}
          onBlurEmpty={onBlurEmpty}
          onFlip={onFlip}
        />
      )}

      {!isRight && <RowActions onDelete={onDelete} />}

      <div
        className="transition-[flex-grow] duration-300 ease-out"
        style={{ flexGrow: !isRight ? 1 : 0, flexShrink: 0, flexBasis: 0 }}
        aria-hidden
      />
    </div>
  );
}

function ImageBubbleEditor({
  src,
  isRight,
  onFlip,
}: {
  src: string;
  isRight: boolean;
  onFlip: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onFlip}
      title="Tap to flip side"
      className={cn(
        "block max-w-[60%] cursor-pointer overflow-hidden rounded-2xl border shadow-sm transition-transform hover:scale-[1.02]",
        isRight ? "border-[#007AFF]/30" : "border-border",
      )}
    >
      {/* eslint-disable-next-line @remotion/warn-native-media-tag */}
      <img
        src={src}
        alt=""
        className="block h-auto max-h-40 w-full object-cover"
      />
    </button>
  );
}

function BubbleBody({
  msg,
  isRight,
  onText,
  onBlurEmpty,
  onFlip,
}: {
  msg: ChatMessage;
  isRight: boolean;
  onText: (t: string) => void;
  onBlurEmpty: () => void;
  onFlip: () => void;
}) {
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onFlip();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target === e.currentTarget) {
          e.preventDefault();
          onFlip();
        }
      }}
      title="Tap to flip side"
      className={`imessage-bubble ${
        isRight ? "imessage-from-me" : "imessage-from-them"
      } max-w-[78%] cursor-pointer px-4 py-2`}
    >
      <textarea
        value={msg.text}
        onChange={(e) => onText(e.target.value)}
        onBlur={onBlurEmpty}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        rows={1}
        spellCheck={false}
        className={`relative z-[1] block w-full min-w-[40px] bg-transparent text-[14px] leading-snug outline-none cursor-text placeholder:opacity-60 ${
          isRight ? "placeholder:text-white/60" : ""
        }`}
        style={
          {
            resize: "none",
            overflow: "hidden",
            fieldSizing: "content",
          } as React.CSSProperties
        }
        placeholder="Empty"
      />
    </div>
  );
}

function RowActions({ onDelete }: { onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Message options"
          // Only revealed on row hover — no persistent buttons cluttering rows.
          className="size-7 shrink-0 rounded-full text-muted-foreground opacity-0 transition-opacity duration-150 hover:bg-muted hover:text-foreground group-hover:opacity-100"
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onClick={onDelete}
          className="text-red-500 focus:text-red-500"
        >
          <HugeiconsIcon icon={Delete02Icon} size={15} />
          Delete message
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The single "Today" divider. The label is FIXED (not editable) — it just marks
 * where history ends and the new, animated conversation begins. Drag its handle
 * up or down to move the split: everything above becomes "already on screen",
 * everything below animates in.
 */
function TodayDivider({
  index,
  dragging,
  onDragStart,
  onDragEnd,
  onHoverGap,
}: {
  index: number;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onHoverGap: (gap: number) => void;
}) {
  return (
    <div
      className={cn(
        "group/divider flex items-center justify-center gap-1.5 py-2 transition-opacity",
        dragging && "opacity-40",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        onHoverGap(index);
      }}
    >
      <button
        type="button"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", "divider");
          onDragStart();
        }}
        onDragEnd={onDragEnd}
        title="Drag to move the divider — messages above it are already on screen"
        className="flex size-6 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground/40 opacity-0 transition-opacity hover:bg-muted hover:text-muted-foreground active:cursor-grabbing group-hover/divider:opacity-100"
      >
        <HugeiconsIcon icon={DragDropVerticalIcon} size={14} />
      </button>
      <div className="rounded-md bg-muted px-2.5 py-1 text-center text-[11px] font-medium text-muted-foreground">
        {DIVIDER_LABEL}
      </div>
    </div>
  );
}

function Composer({
  draft,
  side,
  onSideChange,
  onDraftChange,
  onSend,
  onPickFiles,
}: {
  draft: string;
  side: ChatMessage["side"];
  onSideChange: (side: ChatMessage["side"]) => void;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  onPickFiles: (files: FileList | null) => void;
}) {
  const canSend = draft.trim().length > 0;
  return (
    <div className="shrink-0 border-t border-border bg-background px-5 py-4">
      {/* Side selector — pick who the next message is from. Doesn't auto-flip,
          so you can send several in a row from the same side. */}
      <div className="mb-2.5 flex items-center gap-1 rounded-full bg-muted p-0.5">
        <button
          type="button"
          onClick={() => onSideChange("left")}
          className={cn(
            "flex-1 rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
            side === "left"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Them
        </button>
        <button
          type="button"
          onClick={() => onSideChange("right")}
          className={cn(
            "flex-1 rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
            side === "right"
              ? "bg-[#007AFF] text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          You
        </button>
      </div>
      <div className="flex items-center gap-2">
        {/* The file <input> itself is the click target — stretched over the
            icon at opacity 0 — so the native picker always opens (no label
            forwarding or programmatic .click() that can silently no-op). */}
        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-muted">
          <HugeiconsIcon
            icon={ImageAdd02Icon}
            size={18}
            className="pointer-events-none"
          />
          <input
            type="file"
            accept="image/*"
            aria-label="Attach photo"
            title="Attach photo"
            onChange={(e) => {
              onPickFiles(e.target.files);
              e.target.value = "";
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </div>
        <input
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={`Message as ${side === "right" ? "you" : "them"}…`}
          className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-foreground/30"
        />
        <Button
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            "size-10 shrink-0 rounded-full text-white shadow-sm",
            canSend
              ? side === "right"
                ? "bg-[#007AFF] hover:bg-[#0070E8] active:scale-95"
                : "bg-zinc-500 hover:bg-zinc-600 active:scale-95"
              : "cursor-not-allowed bg-muted text-muted-foreground",
          )}
        >
          <HugeiconsIcon icon={Sent02Icon} size={18} />
        </Button>
      </div>
    </div>
  );
}
