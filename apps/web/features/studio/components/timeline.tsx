"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { type Project, projectDuration } from "@workspace/compositions/project";
import { useEffect, useMemo, useRef } from "react";
import { PX_PER_SECOND } from "../lib/clip-colors";
import { usePlayerFrame } from "../state/player-context";
import { SortableClipBlock } from "./sortable-clip-block";

const TRACK_PADDING_X = 12;

type Props = {
  project: Project;
  selectedClipId: string | null;
  onSelect: (id: string) => void;
  onReorder: (clipIds: string[]) => void;
  onDelete: (id: string) => void;
  onDurationChange: (id: string, durationInFrames: number) => void;
  onSeek: (frame: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
};

export function Timeline({
  project,
  selectedClipId,
  onSelect,
  onReorder,
  onDelete,
  onDurationChange,
  onSeek,
  onScrubStart,
  onScrubEnd,
}: Props) {
  const total = projectDuration(project);
  const totalSeconds = total / project.fps;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const tickEvery = totalSeconds <= 10 ? 1 : totalSeconds <= 30 ? 2 : 5;
  const ticks = useMemo(() => {
    const arr: number[] = [];
    const span = Math.max(totalSeconds, 5);
    for (let s = 0; s <= span; s += tickEvery) arr.push(s);
    return arr;
  }, [totalSeconds, tickEvery]);

  const trackWidth = Math.max(totalSeconds, 5) * PX_PER_SECOND;

  const scrubAreaRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedClipId) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    let sum = 0;
    let target = 0;
    for (const c of project.clips) {
      if (c.id === selectedClipId) {
        target = TRACK_PADDING_X + (sum / project.fps) * PX_PER_SECOND;
        break;
      }
      sum += c.durationInFrames;
    }
    const left = container.scrollLeft;
    const right = left + container.clientWidth;
    const margin = 48;
    if (target < left + margin) {
      container.scrollTo({
        left: Math.max(0, target - margin),
        behavior: "smooth",
      });
    } else if (target > right - margin) {
      container.scrollTo({
        left: target - container.clientWidth + margin,
        behavior: "smooth",
      });
    }
  }, [selectedClipId, project]);

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = project.clips.map((c) => c.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedClipId &&
        !isTextInputFocused()
      ) {
        e.preventDefault();
        onDelete(selectedClipId);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedClipId, onDelete]);

  function frameFromClientX(clientX: number): number {
    const el = scrubAreaRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left - TRACK_PADDING_X;
    const seconds = Math.max(0, x / PX_PER_SECOND);
    const frame = Math.round(seconds * project.fps);
    return Math.max(0, Math.min(total - 1, frame));
  }

  function startScrub(e: React.PointerEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    onScrubStart();
    onSeek(frameFromClientX(e.clientX));

    function onMove(ev: PointerEvent) {
      onSeek(frameFromClientX(ev.clientX));
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      onScrubEnd();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  return (
    <div className="shrink-0 bg-background">
      <div className="flex items-center justify-between px-4 py-2">
        <p className="text-xs font-medium text-muted-foreground">Timeline</p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {totalSeconds.toFixed(2)}s · {project.fps}fps · {project.width}×
          {project.height}
        </p>
      </div>

      <div ref={scrollContainerRef} className="overflow-x-auto">
        <div
          ref={scrubAreaRef}
          style={{ minWidth: trackWidth + 32 }}
          className="relative w-full"
        >
          <TimeRuler
            ticks={ticks}
            pxPerSecond={PX_PER_SECOND}
            onPointerDown={startScrub}
          />

          {project.clips.length === 0 ? (
            <div className="px-4 py-10 text-center text-[12px] text-muted-foreground">
              Empty timeline — add a clip from the library.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={project.clips.map((c) => c.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex items-stretch gap-0 px-3 py-3">
                  {project.clips.map((clip) => (
                    <SortableClipBlock
                      key={clip.id}
                      clip={clip}
                      fps={project.fps}
                      selected={clip.id === selectedClipId}
                      onSelect={() => onSelect(clip.id)}
                      onDelete={() => onDelete(clip.id)}
                      onDurationChange={(d) => onDurationChange(clip.id, d)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <Playhead fps={project.fps} />
        </div>
      </div>
    </div>
  );
}

function TimeRuler({
  ticks,
  pxPerSecond,
  onPointerDown,
}: {
  ticks: number[];
  pxPerSecond: number;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  return (
    <div
      onPointerDown={onPointerDown}
      className="relative h-7 cursor-ew-resize border-b border-border/60 px-3 select-none"
    >
      {ticks.map((t) => (
        <div
          key={t}
          className="pointer-events-none absolute top-0 flex h-full flex-col items-start gap-0.5"
          style={{ left: 12 + t * pxPerSecond }}
        >
          <span className="mt-1 text-[9px] text-muted-foreground tabular-nums">
            {formatTime(t)}
          </span>
          <span className="absolute bottom-0 h-1.5 w-px bg-border" />
        </div>
      ))}
    </div>
  );
}

function Playhead({ fps }: { fps: number }) {
  const frame = usePlayerFrame();
  const left = TRACK_PADDING_X + (frame / fps) * PX_PER_SECOND;
  return (
    <div
      className="pointer-events-none absolute top-0 bottom-0 z-20 -ml-px w-px bg-blue-500"
      style={{ left }}
    >
      <span className="absolute -top-px -left-[5px] size-2.5 rotate-45 rounded-[2px] bg-blue-500 shadow-[0_0_0_1px_rgba(255,255,255,0.6)]" />
    </div>
  );
}

function formatTime(s: number): string {
  const mm = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}

function isTextInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    (el as HTMLElement).isContentEditable
  );
}
