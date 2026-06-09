"use client";

import { Player } from "@remotion/player";
import { componentsById } from "@workspace/compositions/components";
import type { AnyCompositionInfo } from "@workspace/compositions/schema";

/**
 * Shared hover-preview body: a looping Remotion Player at the composition's
 * native aspect ratio with its description underneath. Used by both the
 * Library panel's hover tooltip and the inspector's background-scene picker so
 * the two previews stay visually identical. The caller supplies the floating
 * surface (Tooltip / HoverCard content) — this only renders the inner card.
 */
export function CompositionPreviewCard({ info }: { info: AnyCompositionInfo }) {
  const Component = componentsById[info.id];
  if (!Component) return null;

  return (
    <div className="w-72">
      <div
        className="w-full overflow-hidden"
        style={{ aspectRatio: `${info.width} / ${info.height}` }}
      >
        <Player
          component={Component}
          inputProps={info.defaultProps}
          durationInFrames={info.durationInFrames}
          fps={info.fps}
          compositionWidth={info.width}
          compositionHeight={info.height}
          style={{ width: "100%", height: "100%" }}
          autoPlay
          loop
          initiallyMuted
          acknowledgeRemotionLicense
        />
      </div>
      <div className="px-3 py-2">
        <p className="text-[11px] text-muted-foreground">{info.description}</p>
      </div>
    </div>
  );
}
