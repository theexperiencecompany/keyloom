"use client";

import { ArrowDown01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";
import { useEffect, useMemo, useState } from "react";

import {
  extractPrimaryFamily,
  type FontInfo,
  loadGoogleFont,
  type PaginatedFontsResponse,
  toFontFamilyValue,
} from "../lib/google-fonts";

type Category = "all" | FontInfo["category"];

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sans-serif", label: "Sans" },
  { value: "serif", label: "Serif" },
  { value: "monospace", label: "Mono" },
  { value: "display", label: "Display" },
  { value: "handwriting", label: "Script" },
];

type Props = {
  /** Current CSS `font-family` value (e.g. `"Inter", system-ui, sans-serif`). */
  value: string;
  /** Called with the new CSS `font-family` value when the user picks a font. */
  onChange: (cssValue: string) => void;
  /** Optional placeholder text when no font is set. */
  placeholder?: string;
};

export function FontPicker({ value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [results, setResults] = useState<FontInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const currentFamily = useMemo(() => extractPrimaryFamily(value), [value]);

  // Re-load the current font on mount so the trigger renders in its actual face.
  useEffect(() => {
    if (currentFamily) loadGoogleFont(currentFamily);
  }, [currentFamily]);

  // Fetch results whenever query/category changes (debounced 200ms).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: query,
          limit: "30",
          offset: "0",
        });
        if (category !== "all") params.set("category", category);
        const res = await fetch(`/api/google-fonts?${params.toString()}`);
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as PaginatedFontsResponse;
        if (cancelled) return;
        setResults(data.items);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, query, category]);

  // Eagerly load fonts for visible options so each row renders in its own face.
  useEffect(() => {
    for (const f of results) loadGoogleFont(f.family, ["400"]);
  }, [results]);

  function handlePick(font: FontInfo) {
    loadGoogleFont(font.family);
    onChange(toFontFamilyValue(font.family, font.category));
    setOpen(false);
  }

  function handleClear() {
    onChange("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-3 text-left text-sm transition-colors hover:bg-muted/40"
        >
          <span
            className="truncate"
            style={
              currentFamily ? { fontFamily: value, fontSize: 15 } : undefined
            }
          >
            {currentFamily ?? (
              <span className="text-muted-foreground">
                {placeholder ?? "Pick a font…"}
              </span>
            )}
          </span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        collisionPadding={12}
        className="w-[min(360px,calc(100vw-24px))] overflow-hidden p-0"
      >
        <div className="border-b border-border p-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Google Fonts…"
            className="w-full rounded-sm bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
            spellCheck={false}
          />
          <div className="mt-2 flex flex-wrap gap-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                  category === cat.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto py-1">
          {loading && results.length === 0 ? (
            <div className="px-3 py-6 text-center text-[12px] text-muted-foreground">
              Loading…
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-6 text-center text-[12px] text-muted-foreground">
              No fonts match.
            </div>
          ) : (
            results.map((font) => {
              const isCurrent = currentFamily === font.family;
              return (
                <button
                  key={font.family}
                  type="button"
                  onClick={() => handlePick(font)}
                  className={cn(
                    "flex w-full items-baseline justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted",
                    isCurrent && "bg-muted",
                  )}
                >
                  <span
                    className="truncate text-[18px] leading-tight"
                    style={{
                      fontFamily: toFontFamilyValue(font.family, font.category),
                    }}
                  >
                    {font.family}
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground capitalize">
                    {font.category.replace("-", " ")}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {currentFamily ? (
          <div className="flex items-center justify-between border-t border-border px-2 py-1.5">
            <span className="px-1 text-[11px] text-muted-foreground">
              Current: <span className="text-foreground">{currentFamily}</span>
            </span>
            <Button
              variant="ghost"
              size="xs"
              onClick={handleClear}
              aria-label="Clear font"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
              Clear
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
