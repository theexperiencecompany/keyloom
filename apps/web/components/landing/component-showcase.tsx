"use client";

import {
  compositionModulePath,
  compositions,
} from "@workspace/compositions/registry";
import type { AnyCompositionInfo } from "@workspace/compositions/schema";
import { cn } from "@workspace/ui/lib/utils";
import dynamic from "next/dynamic";
import Link from "next/link";
import * as React from "react";

// Live Remotion previews, lazy-loaded so @remotion/player stays out of the
// initial landing bundle (mirrors the gallery's LivePreview usage).
const LivePreview = dynamic(
  () => import("@/components/gallery/live-preview").then((m) => m.LivePreview),
  { ssr: false },
);

// A scattered "wall" of real components, each card tilted slightly. The masonry
// columns + per-card rotation give the floating-sticker look; hover straightens
// and lifts the card.
const SHOWCASE_IDS = [
  "TweetCard",
  "WhatsAppMessages",
  "MessagePopup",
  "TypingSearch",
  "Terminal",
];

const ROTATIONS = [
  "-rotate-2",
  "rotate-2",
  "-rotate-1",
  "rotate-3",
  "-rotate-3",
  "rotate-1",
];

const CARDS = SHOWCASE_IDS.map((id) =>
  compositions.find((c) => c.id === id),
).filter(Boolean) as AnyCompositionInfo[];

export function ComponentShowcase() {
  return (
    <section className="relative overflow-hidden border-t border-border px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          Motion designed to stop the scroll.
        </h2>
      </div>

      {/* Tilted live-component wall (masonry) */}
      <div className="mx-auto mt-16 max-w-5xl columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
        {CARDS.map((info, i) => (
          <ShowcaseCard key={info.id} info={info} rotation={ROTATIONS[i]!} />
        ))}
      </div>
    </section>
  );
}

function ShowcaseCard({
  info,
  rotation,
}: {
  info: AnyCompositionInfo;
  rotation: string;
}) {
  // Lazy-mount the live <Player> only once the card scrolls into view (same
  // pattern as the gallery's GalleryCard) so the page doesn't compile/run every
  // composition chunk up front — that simultaneous load is what made the cards
  // jitter.
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
      { rootMargin: "250px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Link
      ref={ref}
      href={`/component/${info.id}/edit`}
      prefetch={false}
      aria-label={info.title}
      className={cn(
        // transform-gpu + hidden backface keep the rotated card on a
        // full-resolution composited layer so the live preview stays crisp
        // (rotation otherwise rasterizes blurry). No will-change — pinning the
        // layer permanently forces a repaint every animation frame and jitters.
        "group block break-inside-avoid transform-gpu transition-transform duration-300 ease-out [backface-visibility:hidden] hover:z-10 hover:-translate-y-1.5 hover:rotate-0",
        rotation,
      )}
    >
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-muted/40 shadow-xl ring-1 ring-black/10 transition-shadow duration-300 group-hover:shadow-2xl dark:ring-white/10"
        style={{ aspectRatio: `${info.width} / ${info.height}` }}
      >
        <div className="absolute inset-0">
          {visible ? (
            <LivePreview
              modulePath={compositionModulePath(info)}
              id={info.id}
              defaultProps={info.defaultProps as Record<string, unknown>}
              durationInFrames={info.durationInFrames}
              fps={info.fps}
              width={info.width}
              height={info.height}
            />
          ) : (
            <div className="h-full w-full bg-muted/40" />
          )}
        </div>
      </div>
    </Link>
  );
}
