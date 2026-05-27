"use client";

import { Player } from "@remotion/player";
import { compositionsById } from "@workspace/compositions/registry";
import { Skeleton } from "@workspace/ui/components/skeleton";
import dynamic from "next/dynamic";
import { type ComponentType, useMemo } from "react";

export function Preview({ id }: { id: string }) {
  const info = compositionsById[id];

  // Lazy-load only the requested composition. Each composition becomes its
  // own chunk, so a docs route no longer ships the JS for every other
  // composition (the bundle was ~MBs before this).
  const Component = useMemo(() => {
    if (!info) return null;
    return dynamic<Record<string, unknown>>(
      () =>
        import(
          `@workspace/compositions/compositions/${info.id}/${info.id}`
        ).then((mod) => ({
          default: (
            mod as Record<string, ComponentType<Record<string, unknown>>>
          )[info.id]!,
        })),
      {
        ssr: false,
        loading: () => <Skeleton className="h-full w-full rounded-none" />,
      },
    );
  }, [info]);

  if (!info || !Component) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        No composition registered for id &quot;{id}&quot;.
      </div>
    );
  }
  const isPortrait = info.height > info.width;

  return (
    <div
      className={`not-prose my-6${isPortrait ? " flex justify-center" : ""}`}
    >
      <div
        className="overflow-hidden rounded-lg border border-border bg-background"
        style={{
          aspectRatio: `${info.width} / ${info.height}`,
          ...(isPortrait ? { height: "480px" } : { width: "100%" }),
        }}
      >
        <Player
          component={Component}
          inputProps={info.defaultProps}
          durationInFrames={info.durationInFrames}
          fps={info.fps}
          compositionWidth={info.width}
          compositionHeight={info.height}
          style={{ width: "100%", height: "100%" }}
          loop
          controls
          autoPlay
          initiallyMuted
          acknowledgeRemotionLicense
        />
      </div>
    </div>
  );
}
