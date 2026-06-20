import { Button } from "@workspace/ui/components/button";
import type { Metadata } from "next";
import Link from "next/link";
import { Builder } from "@/features/studio/components/builder";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "Compose, preview, and export Remotion videos in the Keyloom editor.",
};

export default function StudioPage() {
  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-center md:hidden">
        <div className="mx-auto max-w-sm space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            Studio works best on a larger screen
          </h1>
          <p className="text-sm text-muted-foreground">
            The timeline, preview, and inspector need more room than a phone
            offers. Open this on a tablet or desktop to edit.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button asChild>
              <Link href="/">Back home</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <Builder />
      </div>
    </>
  );
}
