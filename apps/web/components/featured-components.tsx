"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Player } from "@remotion/player";
import { componentsById } from "@workspace/compositions/components";
import type { compositions } from "@workspace/compositions/registry";
import Link from "next/link";

type Props = {
  items: typeof compositions;
};

export function FeaturedComponents({ items }: Props) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {items.map((c) => {
        const Component = componentsById[c.id];
        return (
          <Link
            key={c.id}
            href={`/docs/${c.id}`}
            className="group relative overflow-hidden rounded-lg border border-border bg-muted/20 p-5 transition-colors hover:bg-muted/40"
          >
            <div
              className="aspect-video w-full overflow-hidden rounded-md border border-dashed border-border bg-background"
              style={{ aspectRatio: `${c.width} / ${c.height}` }}
            >
              {Component && (
                <Player
                  component={Component}
                  inputProps={c.defaultProps}
                  durationInFrames={c.durationInFrames}
                  fps={c.fps}
                  compositionWidth={c.width}
                  compositionHeight={c.height}
                  style={{ width: "100%", height: "100%" }}
                  autoPlay
                  loop
                  initiallyMuted
                  acknowledgeRemotionLicense
                />
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{c.title}</div>
              </div>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
