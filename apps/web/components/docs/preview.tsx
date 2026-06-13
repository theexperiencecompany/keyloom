"use client";

import { Player } from "@remotion/player";
import {
  compositionModulePath,
  compositionsById,
} from "@workspace/compositions/registry";
import { Skeleton } from "@workspace/ui/components/skeleton";
import dynamic from "next/dynamic";
import { type ComponentType, useMemo } from "react";
import { resolveCompositionMeta } from "@/lib/composition-meta";

export function Preview({
  id,
  width,
  height,
  props,
}: {
  id: string;
  /** Override the preview canvas size (e.g. render a landscape composition
   *  portrait for a phone-style docs preview). Falls back to the registered
   *  dimensions. */
  width?: number;
  height?: number;
  /** Extra props merged on top of the composition's defaultProps. */
  props?: Record<string, unknown>;
}) {
  const info = compositionsById[id];

  // Lazy-load only the requested composition. Each composition becomes its
  // own chunk, so a docs route no longer ships the JS for every other
  // composition (the bundle was ~MBs before this).
  // the preview component for the
  const Component = useMemo(() => {
    if (!info) return null;
    return dynamic<Record<string, unknown>>(
      () =>
        import(
          `@workspace/compositions/compositions/${compositionModulePath(info)}`
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
  const inputProps = props
    ? { ...info.defaultProps, ...props }
    : info.defaultProps;
  // Apply calculateMetadata so the preview's duration/dimensions match the
  // editor (e.g. content-driven length + portrait canvas) instead of the static
  // registry values.
  const meta = resolveCompositionMeta(info, inputProps);
  const previewWidth = width ?? meta.width;
  const previewHeight = height ?? meta.height;
  const isPortrait = previewHeight > previewWidth;

  return (
    <div
      className={`not-prose my-6${isPortrait ? " flex justify-center" : ""}`}
    >
      <div
        className="overflow-hidden rounded-lg border border-border bg-background"
        style={{
          aspectRatio: `${previewWidth} / ${previewHeight}`,
          // Portrait (phone) previews get a tall box so the content renders at
          // a legible size instead of being squeezed tiny; capped to the
          // viewport so it never overflows the page.
          ...(isPortrait ? { height: "min(78vh, 760px)" } : { width: "100%" }),
        }}
      >
        <Player
          component={Component}
          inputProps={inputProps}
          durationInFrames={meta.durationInFrames}
          fps={meta.fps}
          compositionWidth={previewWidth}
          compositionHeight={previewHeight}
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
