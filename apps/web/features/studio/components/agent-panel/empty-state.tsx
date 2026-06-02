"use client";

import {
  ArrowRight01Icon,
  BubbleChatIcon,
  FilmRoll01Icon,
  Rocket01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";

const SUGGESTIONS = [
  { icon: Rocket01Icon, label: "Make a 20s product launch video" },
  { icon: BubbleChatIcon, label: "Show a tweet, then a Slack reaction" },
  { icon: FilmRoll01Icon, label: "Intro title → browser walkthrough → outro" },
];

export function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-1 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
          <HugeiconsIcon icon={SparklesIcon} className="size-5" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
            What are we making?
          </h2>
          <p className="text-balance text-[12px] leading-relaxed text-muted-foreground">
            Describe a video in a sentence. The agent picks the scenes, fills in
            the details, and lays out your timeline.
          </p>
        </div>
      </div>

      <div className="w-full space-y-2">
        <p className="px-1 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
          Try one of these
        </p>
        <div className="space-y-1.5">
          {SUGGESTIONS.map((s) => (
            <Button
              key={s.label}
              type="button"
              variant="outline"
              onClick={() => onPick(s.label)}
              className="group h-auto w-full justify-start gap-3 rounded-xl border-border/60 bg-muted/20 px-2.5 py-2.5 text-left font-normal transition-colors hover:border-border hover:bg-muted/60"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                <HugeiconsIcon icon={s.icon} className="size-3.5" />
              </span>
              <span className="flex-1 text-[12.5px] leading-snug text-muted-foreground transition-colors group-hover:text-foreground">
                {s.label}
              </span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-3.5 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
              />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
