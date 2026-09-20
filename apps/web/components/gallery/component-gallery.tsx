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
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import dynamic from "next/dynamic";
import Link from "next/link";
import * as React from "react";
import { LatestDrop } from "@/components/dashboard/latest-drop";
import { resolveCompositionMeta } from "@/lib/composition-meta";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
} from "@/lib/scene-categories";

// Browse scenes and open their interactive showcase pages.

const LivePreview = dynamic(
  () => import("./live-preview").then((m) => m.LivePreview),
  { ssr: false },
);

type Filter = "all" | CompositionCategory;

const VISIBLE = compositions.filter(
  (c) => !c.hideFromAgent && c.category !== "background",
);

// Scenes whose focal element is small on a full 1920px canvas get zoomed in
// the grid so the tile shows the part that matters. Display-only: the
// showcase page and Studio always render the full frame.
const PREVIEW_ZOOM: Record<string, number> = {
  TypingComposer: 1.35,
  CursorWalkthrough: 1.3,
  StatCounter: 1.25,
  GitHubStarButton: 1.6,
  QrCode: 1.3,
  Text: 1.15,
};

const COUNT_BY_CATEGORY = VISIBLE.reduce((counts, c) => {
  counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  return counts;
}, new Map<CompositionCategory, number>());

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

      {items.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">
          No scenes match “{query}”.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {items.map((info) => (
            <SceneTile key={info.id} info={info} />
          ))}
        </div>
      )}
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

/**
 * A scene shown as itself: the video at its real aspect ratio, edge to
 * edge, with the name underneath. Portrait scenes sit centered on a dark
 * stage inside the same 16:9 tile so the grid stays even.
 */
export function SceneTile({
  info,
  showDescription = true,
}: {
  info: AnyCompositionInfo;
  showDescription?: boolean;
}) {
  const { ref, visible } = useMountOnVisible();
  const meta = resolveCompositionMeta(info);
  const landscape = meta.width >= meta.height;
  const zoom = PREVIEW_ZOOM[info.id] ?? 1;

  return (
    <Link
      ref={ref}
      href={`/component/${info.id}`}
      prefetch={false}
      className="group block min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div
        className={cn(
          "relative aspect-video overflow-hidden rounded-2xl",
          landscape ? "bg-muted/40" : "bg-[#0e0e12]",
        )}
      >
        {visible ? (
          <div
            className="absolute inset-0"
            style={zoom === 1 ? undefined : { transform: `scale(${zoom})` }}
          >
            <LivePreview
              modulePath={compositionModulePath(info)}
              id={info.id}
              defaultProps={info.defaultProps as Record<string, unknown>}
              durationInFrames={meta.durationInFrames}
              fps={meta.fps}
              width={meta.width}
              height={meta.height}
            />
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3 px-0.5">
        <h3 className="truncate text-[15px] font-semibold leading-tight">
          {info.title}
        </h3>
        <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-muted-foreground">
          <span
            aria-hidden
            className="size-1.5 rounded-full"
            style={{ backgroundColor: CATEGORY_COLORS[info.category] }}
          />
          {CATEGORY_LABELS[info.category]}
        </span>
      </div>
      {showDescription ? (
        <p className="mt-1 line-clamp-1 px-0.5 text-[13px] text-muted-foreground">
          {info.description}
        </p>
      ) : null}
    </Link>
  );
}
