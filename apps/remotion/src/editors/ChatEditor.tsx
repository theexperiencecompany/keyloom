"use client";

import {
  BubbleChatIcon,
  CalendarAdd01Icon,
  Clock01Icon,
  Delete02Icon,
  DragDropVerticalIcon,
  ImageAdd02Icon,
  Sent02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { useEffect, useRef, useState } from "react";
import type { EditorProps } from "../schema";
import type { ChatMessage } from "./types";

const FIRST_DELAY = 30;
const GAP_FRAMES = 90;

function computeTypingFrames(m: ChatMessage): number {
  // Photos get a short beat (a brief "..."), then drop in.
  if (m.image) return 36;
  return Math.max(45, Math.min(90, Math.round(m.text.length * 3.5)));
}

function recomputeTimings(messages: ChatMessage[]): ChatMessage[] {
  let cursor = FIRST_DELAY;
  return messages.map((m) => {
    const typingFrames = computeTypingFrames(m);
    const delay = cursor;
    cursor = delay + typingFrames + GAP_FRAMES;
    return { ...m, typingFrames, delay };
  });
}

export function ChatEditor({ value, onChange }: EditorProps<ChatMessage[]>) {
  const [draft, setDraft] = useState("");
  // Drag-to-reorder state. `dragIndex` is the row being dragged; `dropGap` is
  // the insertion slot (0…n) the drop line is currently showing.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropGap, setDropGap] = useState<number | null>(null);
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

  function setMessages(next: ChatMessage[]) {
    onChange(recomputeTimings(next));
  }

  function addMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages([...value, { text: trimmed, side, typingFrames: 0, delay: 0 }]);
    setDraft("");
  }

  function addImage(dataUrl: string) {
    setMessages([
      ...value,
      { text: "", side, image: dataUrl, typingFrames: 0, delay: 0 },
    ]);
  }

  function patchMessage(i: number, patch: Partial<ChatMessage>) {
    const next = value.slice();
    next[i] = { ...next[i]!, ...patch };
    setMessages(next);
  }

  function deleteMessage(i: number) {
    const next = value.slice();
    next.splice(i, 1);
    setMessages(next);
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
    setMessages(next);
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
            onDragLeave={(e) => {
              // Only clear when truly leaving the list, not on child enter.
              if (!e.currentTarget.contains(e.relatedTarget as Node))
                setDropGap(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null && dropGap !== null)
                reorder(dragIndex, dropGap);
              resetDrag();
            }}
          >
            {value.map((m, i) => (
              <div key={i}>
                <DropLine active={dropGap === i} />
                {m.time != null && (
                  <DayDivider
                    value={m.time}
                    onChange={(t) => patchMessage(i, { time: t })}
                    onRemove={() => patchMessage(i, { time: undefined })}
                  />
                )}
                <BubbleRow
                  msg={m}
                  index={i}
                  dragging={dragIndex === i}
                  hasDivider={m.time != null}
                  isHistory={!!m.history}
                  onText={(text) => patchMessage(i, { text })}
                  onBlurEmpty={() => pruneIfEmpty(i)}
                  onFlip={() => flipSide(i)}
                  onDelete={() => deleteMessage(i)}
                  onToggleDivider={() =>
                    patchMessage(i, {
                      time: m.time != null ? undefined : "Today",
                    })
                  }
                  onToggleHistory={() =>
                    patchMessage(i, { history: m.history ? undefined : true })
                  }
                  onDragStart={() => setDragIndex(i)}
                  onDragEnd={resetDrag}
                  onHoverGap={(gap) => setDropGap(gap)}
                />
              </div>
            ))}
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
  hasDivider,
  isHistory,
  onText,
  onBlurEmpty,
  onFlip,
  onDelete,
  onToggleDivider,
  onToggleHistory,
  onDragStart,
  onDragEnd,
  onHoverGap,
}: {
  msg: ChatMessage;
  index: number;
  dragging: boolean;
  hasDivider: boolean;
  isHistory: boolean;
  onText: (t: string) => void;
  onBlurEmpty: () => void;
  onFlip: () => void;
  onDelete: () => void;
  onToggleDivider: () => void;
  onToggleHistory: () => void;
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

      {isRight && (
        <RowActions
          hasDivider={hasDivider}
          isHistory={isHistory}
          onToggleDivider={onToggleDivider}
          onToggleHistory={onToggleHistory}
          onDelete={onDelete}
        />
      )}

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

      {!isRight && (
        <RowActions
          hasDivider={hasDivider}
          isHistory={isHistory}
          onToggleDivider={onToggleDivider}
          onToggleHistory={onToggleHistory}
          onDelete={onDelete}
        />
      )}

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
      {/* biome-ignore lint/a11y/useAltText: editor preview only */}
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

function RowActions({
  hasDivider,
  isHistory,
  onToggleDivider,
  onToggleHistory,
  onDelete,
}: {
  hasDivider: boolean;
  isHistory: boolean;
  onToggleDivider: () => void;
  onToggleHistory: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1 transition-opacity duration-150",
        // Keep the cluster visible when a divider/history is active so it's
        // clear which message owns it; otherwise reveal on row hover.
        hasDivider || isHistory
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100",
      )}
    >
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleHistory}
        title={
          isHistory
            ? "Animate this message in (remove from history)"
            : "Mark as already on screen (history)"
        }
        className={cn(
          "size-8 rounded-full shadow-sm",
          isHistory
            ? "border-amber-500/40 bg-amber-500/10 text-amber-600"
            : "hover:bg-muted",
        )}
      >
        <HugeiconsIcon icon={Clock01Icon} size={15} />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleDivider}
        title={hasDivider ? "Remove day divider" : "Add day divider above"}
        className={cn(
          "size-8 rounded-full shadow-sm",
          hasDivider
            ? "border-[#007AFF]/40 bg-[#007AFF]/10 text-[#007AFF]"
            : "hover:bg-muted",
        )}
      >
        <HugeiconsIcon icon={CalendarAdd01Icon} size={15} />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onDelete}
        title="Delete"
        className="size-8 rounded-full shadow-sm hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500"
      >
        <HugeiconsIcon icon={Delete02Icon} size={15} />
      </Button>
    </div>
  );
}

/** Editable "Today"/date divider chip shown above the message that owns it. */
function DayDivider({
  value,
  onChange,
  onRemove,
}: {
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="group/divider flex items-center justify-center gap-1.5 py-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Today"
        className="max-w-[180px] rounded-md bg-muted px-2.5 py-1 text-center text-[11px] font-medium text-muted-foreground outline-none focus:ring-1 focus:ring-foreground/20"
        style={{ fieldSizing: "content" } as React.CSSProperties}
      />
      <button
        type="button"
        onClick={onRemove}
        title="Remove divider"
        className="flex size-5 items-center justify-center rounded-full text-muted-foreground/50 opacity-0 transition-opacity hover:bg-muted hover:text-red-500 group-hover/divider:opacity-100"
      >
        <HugeiconsIcon icon={Delete02Icon} size={12} />
      </button>
    </div>
  );
}

function Composer({
  draft,
  nextSide,
  onDraftChange,
  onSend,
  onPickFiles,
}: {
  draft: string;
  nextSide: ChatMessage["side"];
  onDraftChange: (v: string) => void;
  onSend: () => void;
  onPickFiles: (files: FileList | null) => void;
}) {
  const canSend = draft.trim().length > 0;
  return (
    <div className="shrink-0 border-t border-border bg-background px-5 py-4">
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
          placeholder={`Message as ${nextSide === "right" ? "you" : "them"}…`}
          className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-foreground/30"
        />
        <Button
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            "size-10 shrink-0 rounded-full text-white shadow-sm",
            canSend
              ? nextSide === "right"
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
