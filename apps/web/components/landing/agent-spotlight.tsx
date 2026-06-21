import {
  ArrowDown01Icon,
  ArrowRight02Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { type CardGradient, TimelineCard } from "./timeline-card";

// Illustrative mini-timeline — the same gradient clip cards as the studio
// timeline. Purely decorative; no live Remotion here.
const SCENES: {
  label: string;
  sublabel: string;
  gradient: CardGradient;
  grow: string;
}[] = [
  { label: "Title", sublabel: "3.0s", gradient: "violet", grow: "flex-[2]" },
  { label: "Feature", sublabel: "5.0s", gradient: "sky", grow: "flex-[3]" },
  { label: "Feature", sublabel: "5.0s", gradient: "emerald", grow: "flex-[3]" },
  { label: "Outro", sublabel: "4.0s", gradient: "amber", grow: "flex-[2]" },
];

export function AgentSpotlight() {
  return (
    <section
      id="agent"
      className="scroll-mt-16 border-b border-dashed border-border px-6 py-20 sm:px-10 sm:py-24"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="inline-flex items-center gap-2 text-[13px] font-medium uppercase tracking-wider text-primary">
            <HugeiconsIcon icon={SparklesIcon} className="size-4" />
            The agent
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Go from idea to timeline in one sentence.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            Tell the agent what you’re making. It picks scenes from the library,
            writes the copy, sets the timing, and lays out the whole timeline —
            ready to play in seconds. Want a change? Ask in plain English, or
            open the Studio and adjust it by hand.
          </p>

          <ul className="mt-6 space-y-2.5">
            {[
              "Chooses the right scenes for your brief",
              "Fills in copy, colors, and timing automatically",
              "Hand off to the Studio whenever you want control",
            ].map((line) => (
              <li
                key={line}
                className="flex items-start gap-2.5 text-[15px] text-foreground/90"
              >
                <HugeiconsIcon
                  icon={ArrowRight02Icon}
                  className="mt-1 size-4 shrink-0 text-primary"
                />
                {line}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/studio">
                Start with a sentence
                <HugeiconsIcon icon={ArrowRight02Icon} data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Flat illustration: prompt → timeline */}
        <div className="rounded-2xl border border-border bg-muted/30 p-5 sm:p-6">
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <HugeiconsIcon
                icon={SparklesIcon}
                className="size-4 text-primary"
              />
              Describe the video you want…
            </div>
            <p className="mt-3 text-[15px] font-medium leading-snug text-foreground">
              “A 20-second product launch — title card, three feature
              highlights, then a call-to-action outro, with upbeat music.”
            </p>
          </div>

          <div className="my-4 flex justify-center text-muted-foreground">
            <HugeiconsIcon icon={ArrowDown01Icon} className="size-5" />
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="mb-2.5 text-[11px] font-medium text-muted-foreground">
              Timeline
            </p>
            <div className="flex gap-1.5">
              {SCENES.map((s) => (
                <TimelineCard
                  key={`${s.label}-${s.gradient}`}
                  gradient={s.gradient}
                  label={s.label}
                  sublabel={s.sublabel}
                  className={s.grow}
                />
              ))}
            </div>
            <div className="mt-1.5 flex">
              <TimelineCard
                gradient="emerald"
                label="♪ Upbeat track"
                height="h-8"
                className="flex-1 justify-center"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
