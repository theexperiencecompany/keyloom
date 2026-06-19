"use client";

import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Player, Thumbnail } from "@remotion/player";
import { componentsById } from "@workspace/compositions/components";
import { compositions } from "@workspace/compositions/registry";
import type {
  AnyCompositionInfo,
  CompositionCategory,
} from "@workspace/compositions/schema";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import * as React from "react";

// Public-facing labels for the internal category ids. Order here is the order
// the tabs render in; only categories that actually have items are shown.
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

type Filter = "all" | CompositionCategory;

export function GalleryBrowser() {
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  // Only ONE preview animates at a time — the hovered card. Every other card
  // shows a cheap static <Thumbnail>, so the page mounts N stills + at most one
  // live <Player>.
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Which categories are actually populated, in CATEGORY_ORDER.
  const presentCategories = React.useMemo(() => {
    const seen = new Set(compositions.map((c) => c.category));
    return CATEGORY_ORDER.filter((c) => seen.has(c));
  }, []);

  const items = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return compositions.filter((c) => {
      if (filter !== "all" && c.category !== filter) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    });
  }, [filter, query]);

  return (
    <div className="space-y-6">
      {/* Filter bar: search + category tabs */}
      <div className="sticky top-14 z-30 -mx-4 border-b border-dashed border-border bg-background/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search components..."
                  className="h-8 pl-9 text-[13px]"
                />
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close search"
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                }}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={15} />
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Search components"
                className="shrink-0"
                onClick={() => setSearchOpen(true)}
              >
                <HugeiconsIcon icon={Search01Icon} size={15} />
              </Button>
              <div className="h-5 w-px shrink-0 bg-border" />
              <nav className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <CategoryTab
                  label="All"
                  active={filter === "all"}
                  onClick={() => setFilter("all")}
                />
                {presentCategories.map((c) => (
                  <CategoryTab
                    key={c}
                    label={CATEGORY_LABELS[c]}
                    active={filter === c}
                    onClick={() => setFilter(c)}
                  />
                ))}
              </nav>
            </>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">
          No components match “{query}”.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((info) => (
            <GalleryCard
              key={info.id}
              info={info}
              active={activeId === info.id}
              onHover={setActiveId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function GalleryCard({
  info,
  active,
  onHover,
}: {
  info: AnyCompositionInfo;
  active: boolean;
  onHover: (id: string | null) => void;
}) {
  const Component = componentsById[info.id];
  // Frame shown at rest — ~70% through, the same point the docs grid pauses on.
  const posterFrame = Math.min(
    info.durationInFrames - 1,
    Math.round(info.durationInFrames * 0.7),
  );

  return (
    <Link
      href={`/docs/${info.id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-muted/20 transition-all hover:border-border/80 hover:bg-muted/40"
      onMouseEnter={() => onHover(info.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        className="relative w-full overflow-hidden bg-background"
        style={{ aspectRatio: `${info.width} / ${info.height}` }}
      >
        {Component ? (
          <>
            <Thumbnail
              component={Component}
              inputProps={info.defaultProps}
              durationInFrames={info.durationInFrames}
              fps={info.fps}
              frameToDisplay={posterFrame}
              compositionWidth={info.width}
              compositionHeight={info.height}
              style={{ width: "100%", height: "100%" }}
            />
            {active ? (
              <div className="absolute inset-0">
                <Player
                  component={Component}
                  inputProps={info.defaultProps}
                  durationInFrames={info.durationInFrames}
                  fps={info.fps}
                  compositionWidth={info.width}
                  compositionHeight={info.height}
                  style={{ width: "100%", height: "100%" }}
                  loop
                  autoPlay
                  initiallyMuted
                  controls={false}
                  numberOfSharedAudioTags={0}
                  acknowledgeRemotionLicense
                />
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-[12px] text-muted-foreground">
            No preview
          </div>
        )}
      </div>
      <div className="space-y-0.5 p-3">
        <div className="truncate text-[13px] font-medium text-foreground">
          {info.title}
        </div>
        <div className="truncate text-[11px] text-muted-foreground">
          {info.description}
        </div>
      </div>
    </Link>
  );
}
