"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { effectsById } from "@workspace/compositions/effects/registry";
import type { Clip } from "@workspace/compositions/project";
import { compositionsById } from "@workspace/compositions/registry";
import {
  DEFAULT_SCENE_TRANSITION,
  type SceneTransitionKind,
} from "@workspace/compositions/transitions";
import { Button } from "@workspace/ui/components/button";
import type React from "react";
import { useRef, useState } from "react";
import { colorForCompositionId, PX_PER_SECOND } from "../lib/clip-colors";

const MIN_DURATION_FRAMES = 15;

type Props = {
  clip: Clip;
  fps: number;
  /** True for the first clip — affects the default transition badge. */
  isFirst: boolean;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDurationChange: (durationInFrames: number) => void;
};

const TRANSITION_GLYPH: Record<SceneTransitionKind, string> = {
  none: "·",
  fade: "◐",
  "swipe-left": "←",
  "swipe-right": "→",
  "swipe-up": "↑",
  "swipe-down": "↓",
  "zoom-in": "⊕",
  "zoom-out": "⊖",
};

const TRANSITION_LABEL: Record<SceneTransitionKind, string> = {
  none: "Hard cut",
  fade: "Fade in",
  "swipe-left": "Swipe in from left",
  "swipe-right": "Swipe in from right",
  "swipe-up": "Swipe in from bottom",
  "swipe-down": "Swipe in from top",
  "zoom-in": "Zoom in",
  "zoom-out": "Zoom out",
};

export function SortableClipBlock({
  clip,
  fps,
  isFirst,
  selected,
  onSelect,
  onDelete,
  onDurationChange,
}: Props) {
  const effectiveTransition =
    clip.transition ??
    (isFirst
      ? { kind: "none" as const, durationInFrames: 0 }
      : DEFAULT_SCENE_TRANSITION);
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
        <div className="flex items-center justify-between gap-1">
          <p className="text-[10px] tabular-nums text-white/75">
            {seconds.toFixed(2)}s
          </p>
          {clip.effects && clip.effects.length > 0 && (
            <div className="flex flex-wrap items-center gap-0.5">
              {clip.effects.slice(0, 3).map((e) => (
                <span
                  key={e.id}
                  title={effectsById[e.effectId]?.title ?? e.effectId}
                  className="rounded-sm bg-black/30 px-1 py-px text-[8px] font-semibold uppercase leading-none tracking-wider text-white/90 backdrop-blur-sm"
                >
                  {(effectsById[e.effectId]?.title ?? e.effectId).slice(0, 4)}
                </span>
              ))}
              {clip.effects.length > 3 && (
                <span className="rounded-sm bg-black/30 px-1 py-px text-[8px] font-semibold leading-none text-white/90">
                  +{clip.effects.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="pointer-events-none absolute inset-0 z-20 rounded-md ring-2 ring-inset ring-blue-500" />
      )}

      {effectiveTransition.kind !== "none" && (
        <span
          title={`Transition: ${TRANSITION_LABEL[effectiveTransition.kind]} · ${(effectiveTransition.durationInFrames / fps).toFixed(2)}s`}
          className="pointer-events-none absolute left-1 top-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-sm bg-black/30 px-1 text-[10px] font-semibold leading-none text-white/95 backdrop-blur-sm"
        >
          {TRANSITION_GLYPH[effectiveTransition.kind]}
        </span>
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
