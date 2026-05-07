"use client"

import { Player } from "@remotion/player"
import { compositionsById } from "@workspace/compositions/registry"
import { componentsById } from "@workspace/compositions/components"

export function Preview({ id }: { id: string }) {
  const info = compositionsById[id]
  const Component = info ? componentsById[info.id] : undefined
  if (!info || !Component) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        No composition registered for id &quot;{id}&quot;.
      </div>
    )
  }
  return (
    <div
      className="overflow-hidden rounded-lg border border-border bg-background not-prose my-6"
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
        loop
        controls
        autoPlay
        initiallyMuted
        acknowledgeRemotionLicense
      />
    </div>
  )
}
