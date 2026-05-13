"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Player } from "@remotion/player";
import { componentsById } from "@workspace/compositions/components";
import type { compositions } from "@workspace/compositions/registry";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  items: typeof compositions;
};

const ROTATE_MS = 6000;

export function FeaturedShowcase({ items }: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % items.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, items.length]);

  const current = items[active];
  if (!current) return null;
  const HeroComponent = componentsById[current.id];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Hero preview */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-muted/20">
        <div className="flex items-center justify-center bg-background p-4 sm:p-6">
          <div
            className="w-full overflow-hidden rounded-md"
            style={{
              aspectRatio: `${current.width} / ${current.height}`,
              maxHeight: 560,
              maxWidth:
                current.width >= current.height
                  ? "100%"
                  : `${(current.width / current.height) * 560}px`,
            }}
          >
            {HeroComponent && (
              <Player
                key={current.id}
                component={HeroComponent}
                inputProps={current.defaultProps}
                durationInFrames={current.durationInFrames}
                fps={current.fps}
                compositionWidth={current.width}
                compositionHeight={current.height}
                style={{ width: "100%", height: "100%" }}
                autoPlay
                loop
                initiallyMuted
                acknowledgeRemotionLicense
              />
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border bg-background/60 px-5 py-4">
          <div className="min-w-0">
            <div className="text-sm font-medium">{current.title}</div>
            <div className="line-clamp-1 text-xs text-muted-foreground">
              {current.description}
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link href={`/docs/${current.id}`}>
              View
              <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Thumbnail rail */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((c, i) => {
          const Thumb = componentsById[c.id];
          const isActive = i === active;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActive(i)}
              className={`group relative overflow-hidden rounded-md border bg-background text-left transition-colors ${
                isActive
                  ? "border-foreground"
                  : "border-border hover:border-foreground/40"
              }`}
            >
              <div
                className="w-full overflow-hidden"
                style={{ aspectRatio: `${c.width} / ${c.height}` }}
              >
                {Thumb && (
                  <Player
                    component={Thumb}
                    inputProps={c.defaultProps}
                    durationInFrames={c.durationInFrames}
                    fps={c.fps}
                    compositionWidth={c.width}
                    compositionHeight={c.height}
                    style={{ width: "100%", height: "100%" }}
                    autoPlay={isActive}
                    loop
                    initiallyMuted
                    acknowledgeRemotionLicense
                  />
                )}
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="truncate text-xs font-medium">{c.title}</span>
              </div>
              {isActive && !paused && (
                <div
                  key={`${c.id}-progress`}
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-foreground"
                  style={{
                    animation: `showcase-progress ${ROTATE_MS}ms linear forwards`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      <style>{`
        @keyframes showcase-progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
