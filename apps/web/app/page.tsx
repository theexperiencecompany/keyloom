import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { DocsHeader } from "@/components/docs-header";
import { ComponentGallery } from "@/components/gallery/component-gallery";
import { SiteFooter } from "@/components/site-footer";

export default function LandingPage() {
  return (
    <div className="mx-auto min-h-screen max-w-7xl border-x border-dashed border-border">
      <DocsHeader />

      <main className="px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        {/* Compact intro — the gallery itself is the hero. */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div>
            <h1 className="text-pretty text-2xl font-semibold tracking-tight sm:text-3xl">
              Ship videos that look expensive.
            </h1>
            <p className="mt-2.5 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground">
              A library of cinematic scenes for Remotion. Browse, preview, and
              drop straight into a video.
            </p>
          </div>
          <Button asChild className="w-full shrink-0 sm:w-auto">
            <Link href="/studio">
              Open Studio
              <HugeiconsIcon icon={ArrowRight02Icon} data-icon="inline-end" />
            </Link>
          </Button>
        </div>

        <ComponentGallery stickyOffsetClass="top-14" />
      </main>

      <SiteFooter />
    </div>
  );
}
