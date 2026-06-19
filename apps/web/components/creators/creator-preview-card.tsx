"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { AnyCompositionInfo } from "@workspace/compositions/schema";
import Link from "next/link";

type Props = {
  // `calculateMetadata` is stripped server-side before this is passed because
  // it's a function and can't cross the RSC → Client boundary.
  info: Omit<AnyCompositionInfo, "calculateMetadata">;
};

// NOTE (temporary): live Remotion <Player> removed for perf — placeholder tile.
export function CreatorPreviewCard({ info }: Props) {
  const isPortrait = info.height > info.width;

  return (
    <Link
      href={`/studio?component=${info.id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-muted/20 transition-colors hover:bg-muted/40"
    >
      <div className="flex items-center justify-center bg-background p-4">
        <div
          className="w-full overflow-hidden rounded-md"
          style={{
            aspectRatio: `${info.width} / ${info.height}`,
            ...(isPortrait
              ? {
                  maxHeight: 360,
                  maxWidth: `${(info.width / info.height) * 360}px`,
                }
              : { maxWidth: "100%" }),
          }}
        >
          {/* TEMP placeholder in place of the live Remotion preview. */}
          <div className="h-full w-full bg-muted/40" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border bg-background/60 px-5 py-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{info.title}</div>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {info.description}
          </p>
        </div>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={16}
          className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
        />
      </div>
    </Link>
  );
}
