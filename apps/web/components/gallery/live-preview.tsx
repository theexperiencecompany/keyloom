"use client";

import { Player } from "@remotion/player";
import { type ComponentType, useCallback } from "react";

// A single live composition preview, autoplaying + looping. This module is only
// ever reached through a dynamic import (see gallery-browser.tsx), so neither
// @remotion/player nor any composition is in the homepage's initial bundle. It's
// mounted only for cards in the viewport, so the page compiles/runs a handful of
// composition chunks at a time — never all 73 at once (bundle-dynamic-imports +
// rendering-content-visibility, Vercel React rules).
export function LivePreview({
  modulePath,
  id,
  defaultProps,
  durationInFrames,
  fps,
  width,
  height,
}: {
  // Pre-computed by the caller from registry metadata so this component never
  // imports the all-compositions barrel.
  modulePath: string;
  id: string;
  defaultProps: Record<string, unknown>;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}) {
  // Lazy-load only this one composition into its own chunk via Remotion's
  // native lazyComponent. The Player wraps it in React.Suspense internally and
  // compiles the chunk on demand. Our composition modules use a named export
  // keyed by `id`, so we remap it to the default export Suspense requires.
  const lazyComponent = useCallback(
    () =>
      import(`@workspace/compositions/compositions/${modulePath}`).then(
        (mod) => ({
          default: (
            mod as Record<string, ComponentType<Record<string, unknown>>>
          )[id]!,
        }),
      ),
    [modulePath, id],
  );

  return (
    <Player
      lazyComponent={lazyComponent}
      inputProps={defaultProps}
      durationInFrames={durationInFrames}
      fps={fps}
      compositionWidth={width}
      compositionHeight={height}
      style={{ width: "100%", height: "100%" }}
      loop
      autoPlay
      // Slow the loops down so a grid of autoplaying previews reads as calm
      // ambient motion rather than a wall of frenetic animation.
      playbackRate={0.7}
      initiallyMuted
      controls={false}
      numberOfSharedAudioTags={0}
      acknowledgeRemotionLicense
    />
  );
}
