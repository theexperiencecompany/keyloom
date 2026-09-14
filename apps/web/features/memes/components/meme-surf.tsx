"use client";

import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  FireIcon,
  VolumeHighIcon,
  VolumeMute02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildChart,
  CHART_FILTERS,
  CHART_TAGS,
  type ChartEntry,
  type ChartFilter,
} from "@/features/memes/lib/meme-chart";
import { DEFAULT_CAPTION } from "@/features/memes/lib/meme-layout";
import {
  backgroundForTemplate,
  type MemeTemplate,
} from "@/features/memes/lib/memes";

const STRIP_SIZE = 8;

const PASTELS = [
  "#fde7ef",
  "#e3f1fd",
  "#e5f6e9",
  "#efe9fd",
  "#fdf3e3",
  "#e9f7f6",
];

function pastelFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return PASTELS[hash % PASTELS.length] as string;
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function MemeSurf({
  templates,
  onSelect,
}: {
  templates: MemeTemplate[];
  onSelect: (t: MemeTemplate) => void;
}) {
  const [filter, setFilter] = useQueryState(
    "tag",
    parseAsStringLiteral(CHART_FILTERS).withDefault("all"),
  );
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [muted, setMuted] = useState(true);

  const chart = useMemo(() => buildChart(templates, new Date()), [templates]);

  const presentTags = useMemo(
    () =>
      CHART_TAGS.filter((tag) => templates.some((t) => tag.test.test(t.id))),
    [templates],
  );

  const filtered = useMemo(() => {
    const tag = CHART_TAGS.find((t) => t.id === filter);
    return tag ? chart.filter((e) => tag.test.test(e.template.id)) : chart;
  }, [chart, filter]);

  const total = filtered.length;
  const current = total ? mod(index, total) : 0;
  const active = filtered[current];
  const prevEntry = total > 1 ? filtered[mod(current - 1, total)] : undefined;
  const nextEntry = total > 1 ? filtered[mod(current + 1, total)] : undefined;

  const surf = (dir: 1 | -1) => {
    setDirection(dir);
    setIndex(current + dir);
  };

  const jump = (target: number) => {
    if (target === current) return;
    setDirection(target > current ? 1 : -1);
    setIndex(target);
  };

  const selectFilter = (next: ChartFilter) => {
    setFilter(next);
    setIndex(0);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("button")) return;
      const typing =
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t.isContentEditable;
      if (e.key === "Enter") {
        if (active) {
          e.preventDefault();
          onSelect(active.template);
        }
        return;
      }
      if (typing) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        surf(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        surf(1);
      } else if (e.key === "m" || e.key === "M") {
        setMuted((m) => !m);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (templates.length === 0) {
    return (
      <Stage>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h2 className="text-lg font-medium tracking-tight">
            No templates yet
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Upload transparent <code>.webm</code> clips to the{" "}
            <code>memes/</code> folder of your R2 bucket and they'll show up
            here.
          </p>
        </div>
      </Stage>
    );
  }

  return (
    <Stage>
      <header className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Flip through. Sound on.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One at a time, like it'll actually be seen. Arrow keys to surf.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterPill
            active={filter === "all"}
            onClick={() => selectFilter("all")}
          >
            <HugeiconsIcon icon={FireIcon} size={13} />
            Hot
          </FilterPill>
          {presentTags.map((tag) => (
            <FilterPill
              key={tag.id}
              active={filter === tag.id}
              onClick={() => selectFilter(tag.id)}
            >
              {tag.label}
            </FilterPill>
          ))}
        </div>
      </header>

      {!active ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Nothing on the chart for this filter.
          </p>
        </div>
      ) : (
        <>
          <div className="relative flex flex-1 items-center justify-center gap-4 pb-16 pt-4 sm:gap-6">
            {prevEntry ? (
              <GhostCard
                entry={prevEntry}
                className="hidden lg:block"
                onClick={() => surf(-1)}
              />
            ) : null}

            <SurfArrow
              icon={ArrowLeft02Icon}
              label="Previous clip"
              side="left"
              disabled={total < 2}
              onClick={() => surf(-1)}
            />

            <ActiveCard
              key={active.template.id}
              entry={active}
              direction={direction}
              muted={muted}
              onToggleMuted={() => setMuted((m) => !m)}
              onAutoplayBlocked={() => setMuted(true)}
              onOpen={() => onSelect(active.template)}
              onSwipe={total > 1 ? surf : undefined}
            />

            <SurfArrow
              icon={ArrowRight02Icon}
              label="Next clip"
              side="right"
              disabled={total < 2}
              onClick={() => surf(1)}
            />

            {nextEntry ? (
              <GhostCard
                entry={nextEntry}
                className="hidden lg:block"
                onClick={() => surf(1)}
              />
            ) : null}
          </div>

          <footer className="relative mt-4 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div className="flex items-center gap-3 max-sm:justify-center">
              <Hint keys={["←", "→"]} label="surf" />
              <Hint keys={["M"]} label="sound" />
              <Hint keys={["↵"]} label="edit" />
            </div>
            <FilmStrip entries={filtered} current={current} onJump={jump} />
            <div aria-hidden className="max-sm:hidden" />
          </footer>
        </>
      )}
    </Stage>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative flex min-h-[calc(100dvh-5.25rem)] flex-col">
      {children}
    </section>
  );
}

const SWIPE_THRESHOLD = 90;

function ActiveCard({
  entry,
  direction,
  muted,
  onToggleMuted,
  onAutoplayBlocked,
  onOpen,
  onSwipe,
}: {
  entry: ChartEntry;
  direction: 1 | -1;
  muted: boolean;
  onToggleMuted: () => void;
  onAutoplayBlocked: () => void;
  onOpen: () => void;
  onSwipe?: (dir: 1 | -1) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ startX: 0, dx: 0, active: false, captured: false });
  const [duration, setDuration] = useState<number | null>(null);
  const bgSrc = backgroundForTemplate(entry.template.id)?.src;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    v.play().catch(() => {
      if (!muted) onAutoplayBlocked();
    });
  }, [muted, onAutoplayBlocked]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onSwipe || e.button !== 0) return;
    drag.current = { startX: e.clientX, dx: 0, active: true, captured: false };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const el = cardRef.current;
    if (!el) return;
    const dx = e.clientX - drag.current.startX;
    drag.current.dx = dx;
    if (!drag.current.captured) {
      if (Math.abs(dx) < 8) return;
      drag.current.captured = true;
      el.setPointerCapture(e.pointerId);
      el.style.transition = "none";
    }
    el.style.transform = `translateX(${dx}px) rotate(${dx * 0.05}deg)`;
  };

  const endDrag = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    const el = cardRef.current;
    if (!el || !drag.current.captured) return;
    const { dx } = drag.current;
    if (onSwipe && Math.abs(dx) > SWIPE_THRESHOLD) {
      const sign = Math.sign(dx);
      el.style.transition = "transform 0.3s ease-out, opacity 0.3s ease-out";
      el.style.transform = `translateX(${sign * window.innerWidth * 0.8}px) rotate(${sign * 24}deg)`;
      el.style.opacity = "0";
      window.setTimeout(() => onSwipe(dx < 0 ? 1 : -1), 220);
    } else {
      el.style.transition = "transform 0.25s ease-out";
      el.style.transform = "";
    }
  };

  const suppressDragClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (Math.abs(drag.current.dx) > 8) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={cardRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={suppressDragClick}
      onDragStart={(e) => e.preventDefault()}
      style={{ touchAction: "pan-y" }}
      className={cn(
        "relative select-none animate-in fade-in duration-300",
        direction === 1 ? "slide-in-from-right-8" : "slide-in-from-left-8",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${entry.template.title} in the editor`}
        className="group relative block h-[min(58vh,540px)] cursor-pointer overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-lg shadow-black/10 outline-none transition-shadow duration-300 hover:shadow-xl hover:shadow-black/15 focus-visible:ring-2 focus-visible:ring-primary"
        style={{ aspectRatio: "9 / 16" }}
      >
        {bgSrc ? (
          // biome-ignore lint/performance/noImgElement: local static preview thumbnail
          <img
            src={bgSrc}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ backgroundColor: pastelFor(entry.template.id) }}
          />
        )}

        {/* biome-ignore lint/a11y/useMediaCaption: meme template preview, no caption track */}
        <video
          ref={videoRef}
          src={entry.template.src}
          autoPlay
          loop
          playsInline
          preload="auto"
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (barRef.current && v.duration) {
              barRef.current.style.width = `${(v.currentTime / v.duration) * 100}%`;
            }
          }}
          className="absolute inset-0 size-full object-contain"
        />

        <p
          className="absolute inset-x-[6%] top-[12%] text-center text-[clamp(14px,1.9vh,20px)] font-extrabold leading-snug text-white [text-shadow:-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000,2px_2px_0_#000,0_2px_0_#000,0_-2px_0_#000,2px_0_0_#000,-2px_0_0_#000]"
          style={{ fontFamily: "'TikTok Sans', sans-serif" }}
        >
          {DEFAULT_CAPTION.text}
        </p>

        {duration ? (
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-1 font-mono text-[10px] tabular-nums text-white/80">
            {formatDuration(duration)}
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/15">
          <div ref={barRef} className="h-full w-0 bg-primary" />
        </div>
      </button>

      <button
        type="button"
        onClick={onToggleMuted}
        aria-label={muted ? "Unmute" : "Mute"}
        className="absolute -right-2 bottom-14 z-10 flex size-9 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <HugeiconsIcon
          icon={muted ? VolumeMute02Icon : VolumeHighIcon}
          size={16}
        />
      </button>

      <div className="pointer-events-none absolute left-1/2 top-full mt-3 w-[150%] -translate-x-1/2 text-center">
        <h2 className="truncate font-heading text-lg font-semibold tracking-tight">
          {entry.template.title}
        </h2>
      </div>
    </div>
  );
}

function GhostCard({
  entry,
  onClick,
  className,
}: {
  entry: ChartEntry;
  onClick: () => void;
  className?: string;
}) {
  const bgSrc = backgroundForTemplate(entry.template.id)?.src;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Surf to ${entry.template.title}`}
      className={cn(
        "relative h-[min(42vh,380px)] shrink-0 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
      style={{ aspectRatio: "9 / 16" }}
    >
      {bgSrc ? (
        // biome-ignore lint/performance/noImgElement: local static preview thumbnail
        <img
          src={bgSrc}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0"
          style={{ backgroundColor: pastelFor(entry.template.id) }}
        />
      )}
      <video
        // biome-ignore lint/a11y/useMediaCaption: muted meme template preview, no caption track
        src={entry.template.src}
        muted
        autoPlay
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 size-full object-contain"
      />
      <span aria-hidden className="absolute inset-0 bg-background/50" />
    </button>
  );
}

function SurfArrow({
  icon,
  label,
  side,
  disabled,
  onClick,
}: {
  icon: typeof ArrowLeft02Icon;
  label: string;
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full max-sm:absolute max-sm:top-1/2 max-sm:z-10 max-sm:-translate-y-1/2",
        side === "left" ? "max-sm:left-0" : "max-sm:right-0",
      )}
    >
      <HugeiconsIcon icon={icon} size={16} />
    </Button>
  );
}

function FilmStrip({
  entries,
  current,
  onJump,
}: {
  entries: ChartEntry[];
  current: number;
  onJump: (index: number) => void;
}) {
  const start = Math.min(
    Math.max(0, current - 3),
    Math.max(0, entries.length - STRIP_SIZE),
  );
  const visible = entries.slice(start, start + STRIP_SIZE);
  const overflow = entries.length - (start + visible.length);

  return (
    <div className="flex items-center justify-center gap-1.5">
      {visible.map((entry, i) => {
        const index = start + i;
        const bgSrc = backgroundForTemplate(entry.template.id)?.src;
        const isActive = index === current;
        return (
          <button
            key={entry.template.id}
            type="button"
            onClick={() => onJump(index)}
            aria-label={`Jump to ${entry.template.title}`}
            aria-current={isActive}
            className={cn(
              "relative h-14 w-9 shrink-0 overflow-hidden rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isActive
                ? "ring-2 ring-primary"
                : "opacity-50 ring-1 ring-border hover:opacity-80",
            )}
          >
            {bgSrc ? (
              // biome-ignore lint/performance/noImgElement: local static preview thumbnail
              <img
                src={bgSrc}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="absolute inset-0"
                style={{ backgroundColor: pastelFor(entry.template.id) }}
              />
            )}
          </button>
        );
      })}
      {overflow > 0 ? (
        <button
          type="button"
          onClick={() => onJump(start + STRIP_SIZE)}
          aria-label={`${overflow} more clips`}
          className="flex h-14 w-9 shrink-0 items-center justify-center rounded-lg bg-card font-mono text-[10px] text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          +{overflow}
        </button>
      ) : null}
    </div>
  );
}

function Hint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
      {keys.map((k) => (
        <kbd
          key={k}
          className="flex h-5 min-w-5 items-center justify-center rounded border bg-card px-1 font-mono text-[10px] text-muted-foreground"
        >
          {k}
        </kbd>
      ))}
      {label}
    </span>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "bg-card text-muted-foreground shadow-sm hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
