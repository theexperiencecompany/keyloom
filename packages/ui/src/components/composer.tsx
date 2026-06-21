"use client";

import { ArrowUp02Icon, StopIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";
import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** One entry the `@`-mention picker can suggest. `id` is what gets inserted
 *  (as `@id`) and reported back via `onMentionsChange`; `label`/`hint` are for
 *  display + fuzzy matching only. */
export interface MentionItem {
  id: string;
  label: string;
  hint?: string;
}

export interface ComposerProps {
  /** Placeholder text for the input */
  placeholder?: string;
  /** Callback when message is submitted */
  onSubmit?: (message: string) => void;
  /** Callback when input value changes */
  onChange?: (value: string) => void;
  /** Whether the composer is disabled */
  disabled?: boolean;
  /** Whether to auto-focus the input */
  autoFocus?: boolean;
  /** Maximum rows for the textarea before it scrolls */
  maxRows?: number;
  /** Initial value (uncontrolled) */
  defaultValue?: string;
  /** Controlled value */
  value?: string;
  /** Additional className for the container */
  className?: string;
  /** Overrides the inner input surface (e.g. a solid background on a recessed
   *  canvas). Defaults to the subtle `bg-muted/40` used inside panels. */
  surfaceClassName?: string;
  /**
   * Whether the composer is in a loading/busy state. The send button turns
   * into a stop button and `onStop` fires instead of `onSubmit`.
   */
  isLoading?: boolean;
  /** Callback when the stop button is pressed while loading */
  onStop?: () => void;
  /**
   * When provided, typing `@` opens a fuzzy picker over these items. Selecting
   * one inserts `@<id>` into the text. Omit to disable mentions entirely.
   */
  mentionItems?: MentionItem[];
  /**
   * Fires whenever the set of `@<id>` tokens present in the text changes — the
   * de-duplicated list of mention ids, in first-seen order.
   */
  onMentionsChange?: (ids: string[]) => void;
}

const LINE_HEIGHT = 24;

/** Subsequence fuzzy match: every char of `q` appears in `text` in order.
 *  Returns a score (lower = better, -1 = no match) favouring early/contiguous
 *  hits, so "msg" ranks MessageBubbles above a scattered match. */
function fuzzyScore(text: string, q: string): number {
  if (!q) return 0;
  const t = text.toLowerCase();
  const query = q.toLowerCase();
  let ti = 0;
  let score = 0;
  let lastHit = -1;
  for (let qi = 0; qi < query.length; qi++) {
    const ch = query[qi]!;
    const found = t.indexOf(ch, ti);
    if (found === -1) return -1;
    score += found - ti; // gap penalty
    if (lastHit !== -1 && found !== lastHit + 1) score += 1; // non-contiguous
    lastHit = found;
    ti = found + 1;
  }
  return score;
}

const MENTION_TOKEN = /@(\w+)/g;
/** The `@query` immediately before the caret, if any. */
const MENTION_AT_CARET = /@(\w*)$/;

/**
 * Chat message input adapted from the heygaia "composer" component
 * (https://ui.heygaia.io/docs/components/composer), trimmed to a plain
 * auto-growing text input + send/stop control. The attach-files and
 * slash-command tool affordances from the upstream component are omitted —
 * the studio agent only handles plain text messages.
 */
export const Composer: FC<ComposerProps> = ({
  placeholder = "What can I do for you today?",
  onSubmit,
  onChange,
  disabled = false,
  autoFocus = false,
  maxRows = 8,
  defaultValue = "",
  value,
  className,
  surfaceClassName,
  isLoading = false,
  onStop,
  mentionItems,
  onMentionsChange,
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use controlled or uncontrolled value
  const currentValue = value !== undefined ? value : inputValue;

  // ───── @-mention state ──────────────────────────────────────────────
  // The active `@query` being typed (text + the index where the `@` sits),
  // or null when the picker is closed. `activeIndex` is the highlighted row.
  const mentionsEnabled = !!mentionItems && mentionItems.length > 0;
  const [mention, setMention] = useState<{ query: string; at: number } | null>(
    null,
  );
  const [activeIndex, setActiveIndex] = useState(0);
  // Caret position to restore after we programmatically rewrite the text on
  // selecting a mention (controlled value updates lose the native caret).
  const pendingCaret = useRef<number | null>(null);

  const suggestions = useMemo(() => {
    if (!mention || !mentionItems) return [] as MentionItem[];
    return mentionItems
      .map((it) => ({
        it,
        score: fuzzyScore(
          `${it.id} ${it.label} ${it.hint ?? ""}`,
          mention.query,
        ),
      }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 8)
      .map((r) => r.it);
  }, [mention, mentionItems]);

  const menuOpen =
    mentionsEnabled && mention !== null && suggestions.length > 0;

  // Report the set of @<id> tokens currently in the text. Recomputed on every
  // value change so deleting a mention drops it from the reported set.
  useEffect(() => {
    if (!onMentionsChange || !mentionItems) return;
    const known = new Set(mentionItems.map((m) => m.id));
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const m of currentValue.matchAll(MENTION_TOKEN)) {
      const id = m[1]!;
      if (known.has(id) && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
    onMentionsChange(ids);
  }, [currentValue, mentionItems, onMentionsChange]);

  // Restore the caret after a controlled rewrite (mention insertion).
  useEffect(() => {
    if (pendingCaret.current == null) return;
    const el = textareaRef.current;
    const pos = pendingCaret.current;
    pendingCaret.current = null;
    if (el) {
      el.focus();
      el.setSelectionRange(pos, pos);
    }
  }, [currentValue]);

  const setValue = useCallback(
    (next: string) => {
      if (value === undefined) setInputValue(next);
      onChange?.(next);
    },
    [onChange, value],
  );

  /** Recompute the `@query` directly before the caret. */
  const syncMention = useCallback(
    (text: string, caret: number) => {
      if (!mentionsEnabled) return;
      const before = text.slice(0, caret);
      const m = before.match(MENTION_AT_CARET);
      if (m) {
        setMention({ query: m[1] ?? "", at: caret - m[0].length });
        setActiveIndex(0);
      } else {
        setMention(null);
      }
    },
    [mentionsEnabled],
  );

  const pickMention = useCallback(
    (item: MentionItem) => {
      if (!mention) return;
      const el = textareaRef.current;
      const caret = el?.selectionStart ?? currentValue.length;
      const head = currentValue.slice(0, mention.at);
      const tail = currentValue.slice(caret);
      const token = `@${item.id} `;
      pendingCaret.current = head.length + token.length;
      setValue(`${head}${token}${tail}`);
      setMention(null);
    },
    [mention, currentValue, setValue],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (value === undefined) setInputValue(newValue);
      onChange?.(newValue);
      syncMention(newValue, e.target.selectionStart ?? newValue.length);
    },
    [onChange, value, syncMention],
  );

  // Auto-resize textarea to fit content, capped at `maxRows`.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = LINE_HEIGHT * maxRows;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, [currentValue, maxRows]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (isLoading) {
        onStop?.();
        return;
      }
      if (currentValue.trim()) {
        onSubmit?.(currentValue);
        if (value === undefined) setInputValue("");
      }
    },
    [currentValue, onSubmit, onStop, value, isLoading],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // While the mention picker is open it owns the arrow/enter/tab/escape
      // keys so the user can navigate and select without submitting.
      if (menuOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIndex((i) => (i + 1) % suggestions.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIndex(
            (i) => (i - 1 + suggestions.length) % suggestions.length,
          );
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          const pick = suggestions[activeIndex];
          if (pick) pickMention(pick);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setMention(null);
          return;
        }
      }
      if (e.key === "Enter" && !e.shiftKey && !disabled && !isLoading) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [
      handleSubmit,
      disabled,
      isLoading,
      menuOpen,
      suggestions,
      activeIndex,
      pickMention,
    ],
  );

  // Keep the mention query in sync when the caret moves by click / arrow keys
  // (not just typing) so the picker opens/closes correctly.
  const handleSelect = useCallback(
    (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
      const el = e.currentTarget;
      syncMention(el.value, el.selectionStart ?? el.value.length);
    },
    [syncMention],
  );

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const canSubmit = currentValue.trim().length > 0;

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className={cn(
          "relative rounded-3xl border border-border bg-muted/40 px-1 pt-1 pb-2 focus-within:border-ring/60",
          surfaceClassName,
        )}
      >
        <Popover open={menuOpen}>
          <PopoverAnchor asChild>
            <form onSubmit={handleSubmit}>
              <div className="relative px-3">
                <textarea
                  ref={textareaRef}
                  value={currentValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onSelect={handleSelect}
                  onClick={handleSelect}
                  placeholder={placeholder}
                  disabled={disabled}
                  rows={1}
                  className={cn(
                    "w-full resize-none bg-transparent py-3 text-sm font-light transition-all",
                    "text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                  style={{
                    minHeight: `${LINE_HEIGHT}px`,
                    maxHeight: `${LINE_HEIGHT * maxRows}px`,
                  }}
                />
              </div>
            </form>
          </PopoverAnchor>
          <PopoverContent
            align="start"
            side="top"
            sideOffset={8}
            // Keep focus in the textarea — the picker is driven from there.
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            className="w-72 p-0"
          >
            <Command shouldFilter={false}>
              <CommandList>
                <CommandEmpty>No components found.</CommandEmpty>
                <CommandGroup heading="Components">
                  {suggestions.map((item, i) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onMouseEnter={() => setActiveIndex(i)}
                      onSelect={() => pickMention(item)}
                      aria-selected={i === activeIndex}
                      className={cn(
                        "flex items-center justify-between gap-2",
                        i === activeIndex && "bg-accent text-accent-foreground",
                      )}
                    >
                      <span className="truncate font-medium">{item.label}</span>
                      {item.hint ? (
                        <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {item.hint}
                        </span>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="flex items-center justify-end px-2 pt-1">
          {isLoading ? (
            <button
              type="button"
              onClick={() => onStop?.()}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-colors cursor-pointer",
                "bg-secondary text-secondary-foreground hover:bg-secondary/80",
              )}
              aria-label="Stop"
            >
              <HugeiconsIcon icon={StopIcon} size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={disabled || !canSubmit}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-colors cursor-pointer",
                "disabled:cursor-not-allowed",
                canSubmit
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-secondary text-muted-foreground",
              )}
              aria-label="Send message"
            >
              <HugeiconsIcon icon={ArrowUp02Icon} size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Composer;
