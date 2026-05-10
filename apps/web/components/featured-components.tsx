"use client";

import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Player } from "@remotion/player";
import { componentsById } from "@workspace/compositions/components";
import type { AnyCompositionInfo } from "@workspace/compositions/schema";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { useState } from "react";

const PAGE_SIZE = 8;

type Props = {
  items: Omit<AnyCompositionInfo, "calculateMetadata">[];
};

export function FeaturedComponents({ items }: Props) {
  const [count, setCount] = useState(PAGE_SIZE);
  const visible = items.slice(0, count);
  const hasMore = count < items.length;

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((c) => {
          const Component = componentsById[c.id];
          return (
            <Link
              key={c.id}
              href={`/docs/${c.id}`}
              // Some compositions (e.g. GaiaScenario) call .click() on inner
              // buttons to force-open accordions for the video render. Those
              // synthetic events bubble up and would trigger Link navigation.
              // Real user clicks have detail >= 1; programmatic clicks have
              // detail === 0 — use that to ignore them.
              onClick={(e) => {
                if (e.detail === 0) e.preventDefault();
              }}
              className="group relative overflow-hidden rounded-lg border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
            >
              <div
                className={`overflow-hidden rounded-md border border-dashed border-border bg-background${c.height > c.width ? " mx-auto" : " w-full"}`}
                style={{
                  aspectRatio: `${c.width} / ${c.height}`,
                  ...(c.height > c.width ? { height: "180px" } : {}),
                }}
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
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm font-medium">{c.title}</div>
                <HugeiconsIcon
                  icon={ArrowRight02Icon}
                  className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                />
              </div>
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setCount((n) => n + PAGE_SIZE)}
          >
            View more
          </Button>
        </div>
      )}
    </div>
  );
}
