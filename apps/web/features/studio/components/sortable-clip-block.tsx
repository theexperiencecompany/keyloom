"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Clip } from "@workspace/compositions/project";
import { compositionsById } from "@workspace/compositions/registry";
import { Button } from "@workspace/ui/components/button";
import type React from "react";
import { useRef, useState } from "react";
import { colorForCompositionId, PX_PER_SECOND } from "../lib/clip-colors";

const MIN_DURATION_FRAMES = 15;

type Props = {
  clip: Clip;
  fps: number;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDurationChange: (durationInFrames: number) => void;
};

export function SortableClipBlock({
  clip,
  fps,
  selected,
  onSelect,
  onDelete,
  onDurationChange,
}: Props) {
  const info = compositionsById[clip.compositionId];
  const [resizing, setResizing] = useState<"left" | "right" | null>(null);

  const seconds = clip.durationInFrames / fps;
  const widthPx = seconds * PX_PER_SECOND;
  const colorClass = colorForCompositionId(clip.compositionId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: clip.id, disabled: resizing !== null });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: resizing ? "none" : transition,
    width: widthPx,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging || resizing ? 10 : 1,
  };

  const framesPerPx = fps / PX_PER_SECOND;

  function startResize(side: "left" | "right", startEvent: React.PointerEvent) {
    startEvent.preventDefault();
    startEvent.stopPropagation();
    setResizing(side);

    const startX = startEvent.clientX;
    const startDuration = clip.durationInFrames;

    function onMove(ev: PointerEvent) {
      const deltaPx = ev.clientX - startX;
      const deltaFrames = Math.round(deltaPx * framesPerPx);
      const next =
        side === "right"
          ? startDuration + deltaFrames
          : startDuration - deltaFrames;
      onDurationChange(Math.max(MIN_DURATION_FRAMES, next));
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      setResizing(null);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative shrink-0 select-none overflow-hidden rounded-md transition-shadow ${
        selected ? "z-10" : ""
      } ${resizing ? "cursor-ew-resize" : "cursor-grab active:cursor-grabbing"}`}
      {...attributes}
      {...listeners}
    >
      {/* Gradient body — top lighter, bottom richer */}
      <div
        className={`bg-gradient-to-b ${colorClass} flex h-14 flex-col justify-between px-3 py-2`}
      >
        {/* Inner top highlight + outline */}
        <div
          className="pointer-events-none absolute inset-0 rounded-md"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.32), inset 0 0 0 1px rgba(255,255,255,0.10)",
          }}
        />

        <p className="truncate text-[11px] font-semibold leading-tight text-white drop-shadow-sm">
          {info?.title ?? clip.compositionId}
        </p>
        <p className="text-[10px] tabular-nums text-white/75">
          {seconds.toFixed(2)}s
        </p>
      </div>

      {selected && (
        <div className="pointer-events-none absolute inset-0 z-20 rounded-md ring-2 ring-inset ring-blue-500" />
      )}

      <ResizeHandle
        side="left"
        active={resizing === "left"}
        onPointerDown={(e) => startResize("left", e)}
      />
      <ResizeHandle
        side="right"
        active={resizing === "right"}
        onPointerDown={(e) => startResize("right", e)}
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        title="Delete"
        className="absolute right-2 top-1 size-5 rounded-full bg-black/30 text-[12px] leading-none text-white/80 opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/50 hover:text-white group-hover:opacity-100"
      >
        ×
      </Button>
    </div>
  );
}

function ResizeHandle({
  side,
  active,
  onPointerDown,
}: {
  side: "left" | "right";
  active: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
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
        className={`h-6 w-[3px] rounded-full bg-white/90 transition-opacity ${
          active ? "opacity-100" : "opacity-0 group-hover:opacity-90"
        }`}
      />
    </div>
  );
}
