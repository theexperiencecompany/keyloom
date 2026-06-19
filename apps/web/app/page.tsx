import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { DocsHeader } from "@/components/docs-header";
import { GalleryBrowser } from "@/components/gallery/gallery-browser";
import { SiteFooter } from "@/components/site-footer";

export default function LandingPage() {
  return (
    <div className="mx-auto min-h-screen max-w-[1600px] border-x border-dashed border-border">
      <DocsHeader />

      <main className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Compact intro — the gallery itself is the hero. */}
        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end sm:gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Ship videos that look expensive.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              A library of cinematic scenes for Remotion. Browse, preview, and
              drop straight into a video.
            </p>
          </div>
          <Button asChild className="hidden shrink-0 sm:inline-flex">
            <Link href="/studio">
              Open Studio
              <HugeiconsIcon icon={ArrowRight02Icon} data-icon="inline-end" />
            </Link>
          </Button>
        </div>

        <GalleryBrowser />
      </main>

      <SiteFooter />
    </div>
  );
}
