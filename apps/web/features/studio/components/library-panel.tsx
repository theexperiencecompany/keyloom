"use client"

import { useState } from "react"
import { Player } from "@remotion/player"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { compositions } from "@workspace/compositions/registry"
import { componentsById } from "@workspace/compositions/components"
import type { AnyCompositionInfo } from "@workspace/compositions/schema"

type Props = {
  onAdd: (compositionId: string) => void
}

export function LibraryPanel({ onAdd }: Props) {
  const textAnimations = compositions.filter(
    (c) => c.id.startsWith("Title") || c.id.startsWith("Text"),
  )
  const others = compositions.filter(
    (c) => !c.id.startsWith("Title") && !c.id.startsWith("Text"),
  )

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-r border-border bg-background">
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
          <p className="text-sm font-medium text-foreground">
            Library
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Click to add a scene</p>
        </div>
        <Section title="Text" items={textAnimations} onAdd={onAdd} />
        <Section title="Templates" items={others} onAdd={onAdd} />
      </aside>
    </TooltipProvider>
  )
}

function Section({
  title,
  items,
  onAdd,
}: {
  title: string
  items: typeof compositions
  onAdd: (id: string) => void
}) {
  if (items.length === 0) return null
  return (
    <div className="border-b border-border/60 px-3 py-3">
      <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-px">
        {items.map((c) => (
          <li key={c.id}>
            <PreviewTooltipItem info={c} onAdd={onAdd} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function PreviewTooltipItem({
  info,
  onAdd,
}: {
  info: AnyCompositionInfo
  onAdd: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const Component = componentsById[info.id]

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          onClick={() => onAdd(info.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onAdd(info.id)
            }
          }}
          className="group flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-accent/60"
        >
          <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/80 group-hover:text-foreground">
            {info.title}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-5 shrink-0"
            tabIndex={-1}
          >
            <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
          </Button>
        </div>
      </TooltipTrigger>
      {open && Component && (
        <TooltipContent
          side="right"
          sideOffset={12}
          hideArrow
          className="block w-72 max-w-none overflow-hidden border border-border bg-background p-0 shadow-xl"
        >
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
              <p className="text-[11px] text-muted-foreground">
                {info.description}
              </p>
            </div>
          </div>
        </TooltipContent>
      )}
    </Tooltip>
  )
}
