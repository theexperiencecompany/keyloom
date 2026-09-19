"use client";

import {
  Cancel01Icon,
  PlusSignIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
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
import { LatestDrop } from "@/components/dashboard/latest-drop";

// Browse scenes and open their interactive showcase pages.

const LivePreview = dynamic(
  () => import("./live-preview").then((m) => m.LivePreview),
  { ssr: false },
);

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

const CATEGORY_DOTS: Record<CompositionCategory, string> = {
  text: "#8b5cf6",
  social: "#ec4899",
  data: "#06b6d4",
  devtools: "#22c55e",
  marketing: "#f59e0b",
  layout: "#64748b",
  captions: "#f43f5e",
  media: "#3b82f6",
  background: "#a1a1aa",
};

type Filter = "all" | CompositionCategory;

const VISIBLE = compositions.filter(
  (c) => !c.hideFromAgent && c.category !== "background",
);

const COUNT_BY_CATEGORY = VISIBLE.reduce((counts, c) => {
  counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  return counts;
}, new Map<CompositionCategory, number>());

// Hand-picked scenes for the featured row; anything missing from the registry
// is skipped, and the row tops up from the front of the library.
const FEATURED_IDS = ["TikTokCaption", "TweetCard", "Terminal"];
const FEATURED_COUNT = 3;
const FEATURED = [
  ...FEATURED_IDS.map((id) => VISIBLE.find((c) => c.id === id)).filter(
    (c): c is (typeof VISIBLE)[number] => Boolean(c),
  ),
  ...VISIBLE.filter((c) => !FEATURED_IDS.includes(c.id)),
].slice(0, FEATURED_COUNT);

// Tall 4:5 portrait preview frame — responsive components reflow to fill it.
const PREVIEW_W = 1080;
const PREVIEW_H = 1350;

// Landscape frame for the larger featured cards.
const FEATURED_PREVIEW_W = 1280;
const FEATURED_PREVIEW_H = 800;

export function ComponentGallery() {
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");

  const presentCategories = React.useMemo(() => {
    const seen = new Set(VISIBLE.map((c) => c.category));
    return CATEGORY_ORDER.filter((c) => seen.has(c));
  }, []);

  const items = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return VISIBLE.filter((c) => {
      if (filter !== "all" && c.category !== filter) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    });
  }, [filter, query]);

  // The featured row only makes sense in the unfiltered default view.
  const showFeatured = filter === "all" && query.trim() === "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Explore scenes
        </h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search scenes"
              placeholder="Search scenes..."
              className="h-9 w-48 rounded-full pl-8 text-[13px] sm:w-60"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={13} />
              </button>
            ) : null}
          </div>
          <Button asChild className="rounded-full">
            <Link href="/studio">
              <HugeiconsIcon icon={PlusSignIcon} size={15} />
              New project
            </Link>
          </Button>
        </div>
      </div>

      <LatestDrop />

      <nav className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CategoryTab
          label="All"
          count={VISIBLE.length}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {presentCategories.map((c) => (
          <CategoryTab
            key={c}
            label={CATEGORY_LABELS[c]}
            count={COUNT_BY_CATEGORY.get(c) ?? 0}
            active={filter === c}
            onClick={() => setFilter(c)}
          />
        ))}
      </nav>

      {showFeatured ? (
        <section>
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Featured
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED.map((info) => (
              <FeaturedCard key={info.id} info={info} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        {showFeatured ? (
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            All scenes
          </h2>
        ) : null}
        {items.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">
            No scenes match “{query}”.
          </p>
        ) : (
          <div
            className={cn(
              "grid grid-cols-2 items-start gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
              showFeatured && "mt-4",
            )}
          >
            {items.map((info) => (
              <GalleryCard key={info.id} info={info} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CategoryTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors",
        active
          ? "bg-foreground text-background"
          : "bg-card text-muted-foreground shadow-sm hover:text-foreground",
      )}
    >
      {label}
      <span
        className={cn(
          "font-mono text-[10px] tabular-nums",
          active ? "text-background/60" : "text-muted-foreground/60",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function CategoryChip({ category }: { category: CompositionCategory }) {
  const color = CATEGORY_DOTS[category];
  return (
    <span
      className="shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em]"
      style={{ backgroundColor: `${color}1f`, color }}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}

function useMountOnVisible() {
  const ref = React.useRef<HTMLAnchorElement | null>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

function FeaturedCard({ info }: { info: AnyCompositionInfo }) {
  const { ref, visible } = useMountOnVisible();

  return (
    <Link
      ref={ref}
      href={`/component/${info.id}`}
      prefetch={false}
      className="group block overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative m-2 aspect-[16/10] overflow-hidden rounded-xl bg-muted/40">
        {visible ? (
          <LivePreview
            modulePath={compositionModulePath(info)}
            id={info.id}
            defaultProps={info.defaultProps as Record<string, unknown>}
            durationInFrames={info.durationInFrames}
            fps={info.fps}
            width={FEATURED_PREVIEW_W}
            height={FEATURED_PREVIEW_H}
          />
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 pb-3.5 pt-1">
        <h3 className="truncate text-[15px] font-semibold leading-tight">
          {info.title}
        </h3>
        <CategoryChip category={info.category} />
      </div>
    </Link>
  );
}

function GalleryCard({ info }: { info: AnyCompositionInfo }) {
  const { ref, visible } = useMountOnVisible();

  return (
    <Link
      ref={ref}
      href={`/component/${info.id}`}
      prefetch={false}
      className="group block overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative m-2 aspect-[4/5] overflow-hidden rounded-xl bg-muted/40">
        {visible ? (
          <LivePreview
            modulePath={compositionModulePath(info)}
            id={info.id}
            defaultProps={info.defaultProps as Record<string, unknown>}
            durationInFrames={info.durationInFrames}
            fps={info.fps}
            width={PREVIEW_W}
            height={PREVIEW_H}
          />
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
        <h3 className="truncate text-[13px] font-semibold leading-tight">
          {info.title}
        </h3>
        <CategoryChip category={info.category} />
      </div>
    </Link>
  );
}
