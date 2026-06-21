import { ArrowRight02Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { GITHUB_URL } from "./links";

export function Hero() {
  return (
    <section className="border-b border-dashed border-border px-6 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <Link
          href="#agent"
          className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon
            icon={SparklesIcon}
            className="size-3.5 text-primary"
          />
          Now with an agent that builds the whole video for you
        </Link>

        <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Ship videos that look expensive — without the production.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
          Keyloom turns a sentence into a finished motion-graphics video.
          Describe what you want, the agent assembles cinematic scenes on a real
          timeline, and you export a Full-HD MP4. No After Effects, no animation
          team.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/studio">
              Open the Studio
              <HugeiconsIcon icon={ArrowRight02Icon} data-icon="inline-end" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Link href="#library">Browse the library</Link>
          </Button>
        </div>

        <p className="mt-5 text-[13px] text-muted-foreground">
          Free and open source ·{" "}
          <Link
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Star it on GitHub
          </Link>
        </p>
      </div>
    </section>
  );
}
