"use client";

import { compositions } from "@workspace/compositions/registry";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

// The registry array is append-ordered, so its tail is the newest batch.
const DROP_SIZE = 6;
const NEWEST = compositions
  .filter((c) => !c.hideFromAgent && c.category !== "background")
  .slice(-DROP_SIZE)
  .reverse();

export function LatestDrop() {
  const featured = NEWEST[0];
  if (!featured) return null;

  const names = NEWEST.slice(0, 3)
    .map((c) => c.title)
    .join(", ");

  return (
    <section className="flex items-center justify-between gap-8 overflow-hidden rounded-2xl bg-[#0e0e12] p-6 text-white sm:p-8">
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
          Latest drop
        </p>
        <h2 className="mt-2 text-pretty font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {NEWEST.length} new scenes just landed.
        </h2>
        <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-white/60">
          {names} and more — fresh off the loom.
        </p>
        <Button asChild size="sm" className="mt-5">
          <Link href={`/component/${featured.id}`} prefetch={false}>
            Open the newest scene
          </Link>
        </Button>
      </div>

      <div className="hidden shrink-0 items-center pr-6 lg:flex">
        <DropCard className="-rotate-6 bg-gradient-to-b from-[#2b2350] to-[#1d1838]">
          <span className="text-center font-heading text-sm font-bold leading-tight tracking-tight text-white/90">
            NEW
            <br />
            DROP
          </span>
        </DropCard>
        <DropCard
          className="-ml-4 rotate-3 bg-gradient-to-b from-[#31204a] to-[#221636]"
          caption={NEWEST[1]?.title}
        >
          <div
            aria-hidden
            className="size-14 rounded-full"
            style={{
              background:
                "conic-gradient(#ec4899 0 40%, #8b5cf6 40% 70%, #3b3348 70% 100%)",
            }}
          />
        </DropCard>
        <DropCard
          className="-ml-4 rotate-[8deg] bg-gradient-to-b from-[#14202e] to-[#101722]"
          caption={NEWEST[2]?.title}
        >
          <div aria-hidden className="flex w-16 flex-col gap-1.5">
            <div className="h-3.5 rounded-md bg-[#38bdf8]" />
            <div className="h-3.5 w-4/5 rounded-md bg-[#0ea5e9]" />
            <div className="h-3.5 w-3/5 rounded-md bg-[#155e75]" />
          </div>
        </DropCard>
      </div>
    </section>
  );
}

function DropCard({
  className,
  caption,
  children,
}: {
  className?: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex h-36 w-28 flex-col items-center justify-center gap-3 rounded-xl px-3 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/10 ${className ?? ""}`}
    >
      {children}
      {caption ? (
        <span className="max-w-full truncate font-mono text-[8px] uppercase tracking-[0.14em] text-white/45">
          {caption}
        </span>
      ) : null}
    </div>
  );
}
