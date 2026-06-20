"use client";

import { VideoAiIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { compositions } from "@workspace/compositions/registry";
import type { CompositionCategory } from "@workspace/compositions/schema";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { useRouter } from "next/navigation";

// Product search: jump straight to a component's editor. (Docs were removed —
// this used to index doc pages; now it indexes the component library.)
const CATEGORY_LABELS: Record<CompositionCategory, string> = {
  text: "Text",
  social: "Social Media",
  data: "Charts & Data",
  devtools: "Dev Tools",
  marketing: "Marketing",
  layout: "Frames & Mockups",
  captions: "Captions",
  media: "Media",
  background: "Backgrounds",
};

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS) as CompositionCategory[];

type SearchItem = { title: string; description: string; href: string };
type SearchGroup = { heading: string; items: SearchItem[] };

const searchGroups: SearchGroup[] = CATEGORY_ORDER.map((cat) => ({
  heading: CATEGORY_LABELS[cat],
  // Backgrounds are studio-only backdrops — not searchable as components.
  items: compositions
    .filter((c) => c.category === cat && c.category !== "background")
    .map((c) => ({
      title: c.title,
      description: c.description,
      href: `/component/${c.id}/edit`,
    })),
})).filter((g) => g.items.length > 0);

// Rank items so title substring matches always beat keyword/fuzzy matches.
function scoreItem(value: string, search: string, keywords?: string[]): number {
  if (!search) return 1;
  const v = value.toLowerCase();
  const s = search.toLowerCase().trim();
  if (!s) return 1;
  if (v === s) return 1;
  if (v.startsWith(s)) return 0.95;
  const titleWords = v.split(/\s+/);
  if (titleWords.some((w) => w.startsWith(s))) return 0.9;
  if (v.includes(s)) return 0.8;
  if (keywords?.some((k) => k.toLowerCase().includes(s))) return 0.3;
  return 0;
}

interface DocsSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocsSearch({ open, onOpenChange }: DocsSearchProps) {
  const router = useRouter();

  function handleSelect(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search components"
      description="Search the component library"
      filter={scoreItem}
    >
      <CommandInput placeholder="Search components..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {searchGroups.map((group) => (
          <CommandGroup key={group.heading} heading={group.heading}>
            {group.items.map((item) => (
              <CommandItem
                key={item.href}
                value={item.title}
                keywords={item.description ? [item.description] : undefined}
                onSelect={() => handleSelect(item.href)}
              >
                <HugeiconsIcon
                  icon={VideoAiIcon}
                  size={14}
                  className="shrink-0 opacity-60"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{item.title}</span>
                  {item.description && (
                    <span className="line-clamp-1 text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
