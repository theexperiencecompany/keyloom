import { ImageAdd02Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

export default function MemesPage() {
  return (
    <div className="px-5 py-6 sm:px-8 lg:px-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Memes</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Spin up shareable memes from your components and clips.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-20 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <HugeiconsIcon icon={SparklesIcon} size={24} />
        </div>
        <h2 className="text-lg font-medium tracking-tight">No memes yet</h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Start from a component in the studio and turn it into a meme you can
          share anywhere.
        </p>
        <Button asChild className="mt-6">
          <Link href="/components">
            <HugeiconsIcon icon={ImageAdd02Icon} size={16} />
            Create a meme
          </Link>
        </Button>
      </div>
    </div>
  );
}
