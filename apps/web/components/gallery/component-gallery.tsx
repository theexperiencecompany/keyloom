"use client";

import {
  Cancel01Icon,
  PencilEdit02Icon,
  PlayIcon,
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
import { useRouter } from "next/navigation";
import * as React from "react";
import { forkPayload } from "@/lib/fork";
import { createUserComponent } from "@/lib/user-components";

// The ONE component gallery — used by both the landing page and the dashboard.
// `showEdit` adds the "Edit" (fork) action for signed-in surfaces; the public
// landing page passes it false and only offers "Open in studio".

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
type Filter = "all" | CompositionCategory;

const VISIBLE = compositions.filter(
  (c) => !c.hideFromAgent && c.category !== "background",
);

// Tall 4:5 portrait preview frame — responsive components reflow to fill it.
const PREVIEW_W = 1080;
const PREVIEW_H = 1350;

export function ComponentGallery({
  showEdit = false,
  stickyOffsetClass = "top-0",
}: {
  /** Show the "Edit" (fork) action — only for signed-in surfaces. */
  showEdit?: boolean;
  /** Tailwind top-* offset so the sticky filter bar sits under the page header. */
  stickyOffsetClass?: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [forking, setForking] = React.useState<string | null>(null);

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

  const openInStudio = (info: AnyCompositionInfo) => {
    router.push(`/studio?component=${info.id}`);
  };

  const editComponent = async (info: AnyCompositionInfo) => {
    if (!showEdit || forking) return;
    const payload = forkPayload(info.id);
    if (!payload) return;
    setForking(info.id);
    const created = await createUserComponent(payload);
    setForking(null);
    if (created) {
      router.push(`/component/${encodeURIComponent(created.id)}/edit`);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "sticky z-20 -mx-5 mb-8 border-b border-border bg-background/95 px-5 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10",
          stickyOffsetClass,
        )}
      >
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
        <div className="grid grid-cols-2 items-start gap-x-5 gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((info) => (
            <GalleryCard
              key={info.id}
              info={info}
              showEdit={showEdit}
              forking={forking === info.id}
              onOpen={() => openInStudio(info)}
              onEdit={() => editComponent(info)}
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
  showEdit,
  forking,
  onOpen,
  onEdit,
}: {
  info: AnyCompositionInfo;
  showEdit: boolean;
  forking: boolean;
  onOpen: () => void;
  onEdit: () => void;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
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

  return (
    <div ref={ref} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted/40 ring-1 ring-border/50 transition-all duration-200 group-hover:ring-border group-hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)]">
        <div className="absolute inset-0">
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
          ) : (
            <div className="h-full w-full bg-muted/40" />
          )}
        </div>

        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 opacity-0 backdrop-blur-[1px] transition-opacity duration-150 group-hover:opacity-100">
          <Button size="sm" onClick={onOpen}>
            <HugeiconsIcon icon={PlayIcon} size={14} />
            Open in studio
          </Button>
          {showEdit ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={onEdit}
              disabled={forking}
            >
              <HugeiconsIcon icon={PencilEdit02Icon} size={14} />
              {forking ? "Forking…" : "Edit"}
            </Button>
          ) : null}
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
    </div>
  );
}
