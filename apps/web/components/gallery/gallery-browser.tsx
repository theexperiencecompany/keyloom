"use client";

import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  compositionModulePath,
  compositions,
} from "@workspace/compositions/registry";
import type {
  AnyCompositionInfo,
  CompositionCategory,
} from "@workspace/compositions/schema";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import dynamic from "next/dynamic";
import Link from "next/link";
import * as React from "react";

// Remotion lives behind this dynamic import, so @remotion/player and the
// composition components are never part of the homepage's initial bundle. A
// preview is mounted only while its card is in the viewport (see GalleryCard),
// so the page only ever runs a handful of composition chunks at a time — never
// all 73 (bundle-dynamic-imports + rendering-content-visibility, Vercel React).
const LivePreview = dynamic(
  () => import("./live-preview").then((m) => m.LivePreview),
  { ssr: false },
);

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

// Background compositions are studio-only backdrops, not standalone products —
// keep them out of the gallery. They stay fully available inside the editor.
const VISIBLE_COMPOSITIONS = compositions.filter(
  (c) => c.category !== "background",
);

export function GalleryBrowser() {
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);

  // Which categories are actually populated, in CATEGORY_ORDER.
  const presentCategories = React.useMemo(() => {
    const seen = new Set(VISIBLE_COMPOSITIONS.map((c) => c.category));
    return CATEGORY_ORDER.filter((c) => seen.has(c));
  }, []);

  const items = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return VISIBLE_COMPOSITIONS.filter((c) => {
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
      <div className="sticky top-14 z-30 -mx-5 border-b border-dashed border-border bg-background/95 px-5 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
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
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((info) => (
            <GalleryCard key={info.id} info={info} />
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

function GalleryCard({ info }: { info: AnyCompositionInfo }) {
  // Mount the live preview the first time the card nears the viewport, then keep
  // it mounted for good. This defers Remotion off the initial load (cards below
  // the fold don't compile/mount until you scroll to them) WITHOUT re-blanking:
  // once a preview has loaded, scrolling away and back leaves it in place instead
  // of tearing it down and reloading. Same idea as <img loading="lazy">.
  const ref = React.useRef<HTMLAnchorElement | null>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect(); // loaded once — never tear it back down
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Card shape is clamped to a [0.75, 1.4] band for consistent, slightly-tall
  // cards. The preview COVERS the tile — sized to the composition's own aspect
  // and scaled so the smaller side fills, with the overflow cropped — so there
  // are no letterbox gutters (the "strip" look).
  const compAspect = info.width / info.height;
  const cardAspect = Math.min(Math.max(compAspect, 0.75), 1.4);
  const coverFill: React.CSSProperties =
    compAspect >= cardAspect ? { height: "100%" } : { width: "100%" };

  return (
    <Link
      ref={ref}
      // Clicking a component opens it in the full Studio (more features than the
      // standalone editor) with that composition added as the first clip.
      href={`/studio?component=${info.id}`}
      // No prefetch: the studio is a heavy route; hover-prefetching every card
      // would kick off its compile. Click still works.
      prefetch={false}
      className="group block"
    >
      {/* Media tile: borderless, big radius, subtle ring. The preview covers
          the tile (cropping a sliver), so there are no letterbox gutters. */}
      <div
        className="relative overflow-hidden rounded-2xl bg-muted/40 ring-1 ring-border/50 transition-all duration-200 group-hover:ring-border group-hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)]"
        style={{ aspectRatio: `${cardAspect}` }}
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ aspectRatio: `${compAspect}`, ...coverFill }}
        >
          {visible ? (
            <LivePreview
              modulePath={compositionModulePath(info)}
              id={info.id}
              defaultProps={info.defaultProps}
              durationInFrames={info.durationInFrames}
              fps={info.fps}
              width={info.width}
              height={info.height}
            />
          ) : (
            // Off-screen placeholder — no Remotion mounted.
            <div className="h-full w-full bg-muted/40" />
          )}
        </div>
      </div>
      <div className="px-0.5 pt-3">
        <h3 className="truncate text-[15px] font-semibold leading-tight text-foreground">
          {info.title}
        </h3>
        <p className="mt-1 truncate text-[13px] text-muted-foreground">
          {CATEGORY_LABELS[info.category]}
        </p>
      </div>
    </Link>
  );
}
