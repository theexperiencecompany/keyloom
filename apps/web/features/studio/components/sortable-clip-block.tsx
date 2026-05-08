"use client"

import { useRef, useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Clip } from "@workspace/compositions/project"
import { compositionsById } from "@workspace/compositions/registry"
import { PX_PER_SECOND, colorForCompositionId } from "../lib/clip-colors"

const MIN_DURATION_FRAMES = 15

type Props = {
  clip: Clip
  fps: number
  selected: boolean
  onSelect: () => void
  onDelete: () => void
  onDurationChange: (durationInFrames: number) => void
}

export function SortableClipBlock({
  clip,
  fps,
  selected,
  onSelect,
  onDelete,
  onDurationChange,
}: Props) {
  const info = compositionsById[clip.compositionId]
  const [resizing, setResizing] = useState<"left" | "right" | null>(null)

  const seconds = clip.durationInFrames / fps
  const widthPx = Math.max(80, seconds * PX_PER_SECOND)
  const colorClass = colorForCompositionId(clip.compositionId)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: clip.id, disabled: resizing !== null })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: resizing ? "none" : transition,
    width: widthPx,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging || resizing ? 10 : 1,
  }

  const framesPerPx = fps / PX_PER_SECOND

  function startResize(side: "left" | "right", startEvent: React.PointerEvent) {
    startEvent.preventDefault()
    startEvent.stopPropagation()
    setResizing(side)

    const startX = startEvent.clientX
    const startDuration = clip.durationInFrames

    function onMove(ev: PointerEvent) {
      const deltaPx = ev.clientX - startX
      const deltaFrames = Math.round(deltaPx * framesPerPx)
      const next =
        side === "right"
          ? startDuration + deltaFrames
          : startDuration - deltaFrames
      onDurationChange(Math.max(MIN_DURATION_FRAMES, next))
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      setResizing(null)
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative shrink-0 select-none overflow-hidden rounded-md ring-offset-2 ring-offset-[#0d0d0f] transition-shadow ${
        selected ? "ring-2 ring-blue-500" : "ring-0"
      } ${resizing ? "cursor-ew-resize" : "cursor-grab active:cursor-grabbing"}`}
      {...attributes}
      {...listeners}
    >
      <div
        className={`bg-gradient-to-br ${colorClass} flex h-14 flex-col justify-between px-3 py-2`}
      >
        <p className="truncate text-[11px] font-semibold leading-tight text-white drop-shadow-sm">
          {info?.title ?? clip.compositionId}
        </p>
        <p className="text-[10px] tabular-nums text-white/80">
          {seconds.toFixed(2)}s
        </p>
      </div>

      <ResizeHandle
        side="left"
        active={resizing === "left"}
        visible={selected || resizing !== null}
        onPointerDown={(e) => startResize("left", e)}
      />
      <ResizeHandle
        side="right"
        active={resizing === "right"}
        visible={selected || resizing !== null}
        onPointerDown={(e) => startResize("right", e)}
      />

      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        onPointerDown={(e) => e.stopPropagation()}
        title="Delete"
        className={`absolute right-1 top-1 flex size-5 items-center justify-center rounded bg-black/30 text-[12px] leading-none text-white/80 backdrop-blur-sm transition-opacity hover:bg-red-500/50 hover:text-white ${
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        ×
      </button>
    </div>
  )
}

function ResizeHandle({
  side,
  active,
  visible,
  onPointerDown,
}: {
  side: "left" | "right"
  active: boolean
  visible: boolean
  onPointerDown: (e: React.PointerEvent) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onClick={(e) => e.stopPropagation()}
      className={`absolute top-0 z-10 flex h-full w-2.5 cursor-ew-resize items-center justify-center ${
        side === "left" ? "left-0" : "right-0"
      }`}
    >
      <span
        className={`h-6 w-[3px] rounded-full bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.25)] transition-opacity ${
          active || visible ? "opacity-100" : "opacity-0 group-hover:opacity-90"
        }`}
      />
    </div>
  )
}
