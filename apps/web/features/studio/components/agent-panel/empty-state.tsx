"use client";

import { SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const SUGGESTIONS = [
  "Make a 20s product launch video",
  "Show a tweet, then a Slack reaction",
  "Intro title → browser walkthrough → outro",
];

export function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-2 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <HugeiconsIcon icon={SparklesIcon} className="size-5" />
      </div>
      <div>
        <p className="text-sm font-medium">Stitch a video from a brief</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Tell the agent what you want and it will pick scenes from the library,
          set props, and lay them out on the timeline.
        </p>
      </div>
      <ul className="w-full space-y-1.5">
        {SUGGESTIONS.map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => onPick(s)}
              className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-left text-[12px] text-muted-foreground transition-colors hover:border-border/80 hover:bg-muted hover:text-foreground"
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
