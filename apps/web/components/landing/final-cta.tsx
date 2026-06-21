import { ArrowRight02Icon, StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { GITHUB_URL } from "./links";

export function FinalCta() {
  return (
    <section className="px-6 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Ship your first video in minutes.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
          Open the Studio and start with a sentence. It’s free, open source, and
          runs entirely in your browser.
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
            <Link href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <HugeiconsIcon icon={StarIcon} data-icon="inline-start" />
              Star on GitHub
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
