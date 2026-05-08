"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BubbleChatIcon,
  Delete02Icon,
  Sent02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import type { EditorProps } from "../schema";
import type { ChatMessage } from "./types";

const FIRST_DELAY = 30;
const GAP_FRAMES = 90;

function computeTypingFrames(text: string): number {
  return Math.max(45, Math.min(90, Math.round(text.length * 3.5)));
}

function recomputeTimings(messages: ChatMessage[]): ChatMessage[] {
  let cursor = FIRST_DELAY;
  return messages.map((m) => {
    const typingFrames = computeTypingFrames(m.text);
    const delay = cursor;
    cursor = delay + typingFrames + GAP_FRAMES;
    return { ...m, typingFrames, delay };
  });
}

export function ChatEditor({ value, onChange }: EditorProps<ChatMessage[]>) {
  const [draft, setDraft] = useState("");
  const [flashKey, setFlashKey] = useState(0);
  const [flashedIndex, setFlashedIndex] = useState<number | null>(null);

  const lastSide = value[value.length - 1]?.side ?? "left";
  const nextSide: ChatMessage["side"] = lastSide === "left" ? "right" : "left";

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

  useEffect(() => {
    if (flashedIndex === null) return;
    const t = setTimeout(() => setFlashedIndex(null), 500);
    return () => clearTimeout(t);
  }, [flashedIndex, flashKey]);

  function setMessages(next: ChatMessage[]) {
    onChange(recomputeTimings(next));
  }

  function addMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages([
      ...value,
      { text: trimmed, side: nextSide, typingFrames: 0, delay: 0 },
    ]);
    setDraft("");
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
    setFlashedIndex(i);
    setFlashKey((k) => k + 1);
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-background"
      style={{ ["--imessage-bg" as string]: "var(--background)" }}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {value.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2 px-5 py-6">
            {value.map((m, i) => (
              <BubbleRow
                key={i}
                msg={m}
                flashing={flashedIndex === i}
                onText={(text) => patchMessage(i, { text })}
                onFlip={() => flipSide(i)}
                onDelete={() => deleteMessage(i)}
              />
            ))}
          </div>
        )}
      </div>

      <Composer
        draft={draft}
        nextSide={nextSide}
        onDraftChange={setDraft}
        onSend={() => addMessage(draft)}
      />
    </div>
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
          Type below. Tap a bubble to flip its side.
        </p>
      </div>
    </div>
  );
}

function BubbleRow({
  msg,
  flashing,
  onText,
  onFlip,
  onDelete,
}: {
  msg: ChatMessage;
  flashing: boolean;
  onText: (t: string) => void;
  onFlip: () => void;
  onDelete: () => void;
}) {
  const isRight = msg.side === "right";
  return (
    <div className="group flex w-full items-center gap-2">
      <div
        className="transition-[flex-grow] duration-300 ease-out"
        style={{ flexGrow: isRight ? 1 : 0, flexShrink: 0, flexBasis: 0 }}
        aria-hidden
      />

      {isRight && <DeleteAction onDelete={onDelete} />}

      <BubbleBody
        msg={msg}
        isRight={isRight}
        flashing={flashing}
        onText={onText}
        onFlip={onFlip}
      />

      {!isRight && <DeleteAction onDelete={onDelete} />}

      <div
        className="transition-[flex-grow] duration-300 ease-out"
        style={{ flexGrow: !isRight ? 1 : 0, flexShrink: 0, flexBasis: 0 }}
        aria-hidden
      />
    </div>
  );
}

function BubbleBody({
  msg,
  isRight,
  flashing,
  onText,
  onFlip,
}: {
  msg: ChatMessage;
  isRight: boolean;
  flashing: boolean;
  onText: (t: string) => void;
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
      } max-w-[78%] cursor-pointer px-4 py-2 transition-[transform,box-shadow] duration-300 ease-out ${
        flashing
          ? "ring-2 ring-offset-4 ring-offset-background ring-foreground scale-[1.04]"
          : ""
      }`}
    >
      <textarea
        value={msg.text}
        onChange={(e) => onText(e.target.value)}
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

function DeleteAction({ onDelete }: { onDelete: () => void }) {
  return (
    <div className="flex shrink-0 items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
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

function Composer({
  draft,
  nextSide,
  onDraftChange,
  onSend,
}: {
  draft: string;
  nextSide: ChatMessage["side"];
  onDraftChange: (v: string) => void;
  onSend: () => void;
}) {
  const canSend = draft.trim().length > 0;
  return (
    <div className="shrink-0 border-t border-border bg-background px-5 py-4">
      <div className="flex items-center gap-2">
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
