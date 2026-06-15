import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { compositionsById } from "@workspace/compositions/registry";
import type { Metadata } from "next";
import Link from "next/link";
import { CreatorPreviewCard } from "@/components/creators/creator-preview-card";

export const metadata: Metadata = {
  title: "Creators — Keyloom",
  description:
    "Components built for short-form creators — TikTok-style captions, vertical voiceover tools, and viral-content scenes.",
};

// Curated list of creator-focused composition ids. Add new ones here.
const CREATOR_IDS = [
  "TikTokCaption",
  "CaptionTrack",
  "InstagramPost",
  "TweetCard",
] as const;

export default function CreatorsPage() {
  // Strip `calculateMetadata` — it's a function and can't be serialized
  // across the RSC → Client Component boundary into CreatorPreviewCard.
  const items = CREATOR_IDS.map((id) => compositionsById[id])
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map(({ calculateMetadata: _calc, ...rest }) => rest);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-10 lg:px-8 xl:px-12">
      <header className="mb-10 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          For Creators
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Built for short-form
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Components hand-picked for TikTok, Reels and Shorts. Drop in an MP3,
          get word-timed captions, or grab a viral-tweet card — every scene is
          one click away from the Studio timeline.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {items.map((c) => (
          <CreatorPreviewCard key={c.id} info={c} />
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
        <p className="text-sm font-medium">Need a different scene?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse the full library or jump straight into the Studio.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs/components"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            Browse components
            <HugeiconsIcon icon={ArrowRight02Icon} size={13} />
          </Link>
          <Link
            href="/studio"
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-90"
          >
            Open Studio
            <HugeiconsIcon icon={ArrowRight02Icon} size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
