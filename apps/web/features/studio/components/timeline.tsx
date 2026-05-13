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
import { ZoomInAreaIcon, ZoomOutAreaIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type Project, projectDuration } from "@workspace/compositions/project";
import {
  resolveTransition,
  type SceneTransition,
} from "@workspace/compositions/transitions";
import { Button } from "@workspace/ui/components/button";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  PX_PER_SECOND as DEFAULT_PX_PER_SECOND,
  paletteForCompositionId,
} from "../lib/clip-colors";
import { usePlayerFrame } from "../state/player-context";
import { SortableClipBlock } from "./sortable-clip-block";
import { TransitionStrip } from "./transition-strip";

const TRACK_PADDING_X = 12;
const MIN_PX_PER_SECOND = 20;
const MAX_PX_PER_SECOND = 400;
const ZOOM_STEP = 1.25;

type Props = {
  project: Project;
  selectedClipId: string | null;
  onSelect: (id: string) => void;
  onReorder: (clipIds: string[]) => void;
  onDelete: (id: string) => void;
  onDurationChange: (id: string, durationInFrames: number) => void;
  onUpdateTransition: (id: string, transition: SceneTransition) => void;
  /**
   * Fired when the user clicks a transition strip — selects the entering
   * clip AND jumps the Inspector to the Motion tab so the user lands
   * directly on the transition controls.
   */
  onSelectTransition: (id: string) => void;
  onSeek: (frame: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
};

type ClipLayout = {
  /** Frames of overlap with the previous clip (this clip's incoming transition). */
  leadingFrames: number;
  /** Frames of overlap with the next clip (the next clip's incoming transition). */
  trailingFrames: number;
};

export function Timeline({
  project,
  selectedClipId,
  onSelect,
  onReorder,
  onDelete,
  onDurationChange,
  onUpdateTransition,
  onSelectTransition,
  onSeek,
  onScrubStart,
  onScrubEnd,
}: Props) {
  const total = projectDuration(project);
  const totalSeconds = total / project.fps;
  const fps = project.fps;

  const [pxPerSecond, setPxPerSecond] = useState(DEFAULT_PX_PER_SECOND);
  const framesPerPx = fps / pxPerSecond;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // Pick a tick interval so labels stay readable at any zoom level. Aim for
  // ~80px between ticks; snap to a friendly step.
  const tickEvery = useMemo(() => {
    const steps = [1, 2, 5, 10, 15, 30, 60, 120, 300];
    const target = 80;
    return (
      steps.find((s) => s * pxPerSecond >= target) ?? steps[steps.length - 1]!
    );
  }, [pxPerSecond]);

  const ticks = useMemo(() => {
    const arr: number[] = [];
    const span = Math.max(totalSeconds, 5);
    for (let s = 0; s <= span; s += tickEvery) arr.push(s);
    return arr;
  }, [totalSeconds, tickEvery]);

  const trackWidth = Math.max(totalSeconds, 5) * pxPerSecond;

  /**
   * For each clip, the overlap (in frames) it shares with its neighbours.
   * `leadingFrames` is the clip's own incoming transition; `trailingFrames`
   * is the next clip's incoming transition — they MUST agree across the
   * seam or the layout drifts from the rendered output.
   */
  const layouts: ClipLayout[] = useMemo(() => {
    const transitionFrames = project.clips.map((clip, i) => {
      if (i === 0) return 0;
      const t = resolveTransition({
        clipTransition: clip.transition,
        projectDefault: project.defaultTransition,
        index: i,
      });
      return t.kind === "none" ? 0 : t.durationInFrames;
    });
    return project.clips.map((_, i) => ({
      leadingFrames: transitionFrames[i] ?? 0,
      trailingFrames: transitionFrames[i + 1] ?? 0,
    }));
  }, [project.clips, project.defaultTransition]);

  const scrubAreaRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Zoom while keeping the time under `anchorClientX` (or the container
  // center, when no anchor is given) in place. Returns the actually-applied
  // zoom so we can early-out when at the bounds.
  const zoomBy = useCallback((factor: number, anchorClientX?: number) => {
    setPxPerSecond((prev) => {
      const next = Math.max(
        MIN_PX_PER_SECOND,
        Math.min(MAX_PX_PER_SECOND, prev * factor),
      );
      if (next === prev) return prev;
      const container = scrollContainerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const anchorX =
          anchorClientX !== undefined
            ? anchorClientX - rect.left
            : container.clientWidth / 2;
        const contentX = anchorX + container.scrollLeft;
        const newScroll = (contentX * next) / prev - anchorX;
        // Apply after React commits the new width so scrollLeft isn't
        // clamped to the old (smaller) scroll range.
        requestAnimationFrame(() => {
          container.scrollLeft = Math.max(0, newScroll);
        });
      }
      return next;
    });
  }, []);

  // Ctrl/Cmd + wheel = zoom; plain wheel keeps horizontal scrolling.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    function onWheel(e: WheelEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      zoomBy(factor, e.clientX);
    }
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  useEffect(() => {
    if (!selectedClipId) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    let startFrame = 0;
    let target = 0;
    for (let i = 0; i < project.clips.length; i++) {
      const c = project.clips[i];
      if (!c) continue;
      if (i > 0) startFrame -= layouts[i]?.leadingFrames ?? 0;
      if (c.id === selectedClipId) {
        target = TRACK_PADDING_X + (startFrame / fps) * pxPerSecond;
        break;
      }
      startFrame += c.durationInFrames;
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
  }, [selectedClipId, project.clips, layouts, fps, pxPerSecond]);

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
    const seconds = Math.max(0, x / pxPerSecond);
    const frame = Math.round(seconds * fps);
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

  const zoomPct = Math.round((pxPerSecond / DEFAULT_PX_PER_SECOND) * 100);
  const atMinZoom = pxPerSecond <= MIN_PX_PER_SECOND + 0.01;
  const atMaxZoom = pxPerSecond >= MAX_PX_PER_SECOND - 0.01;

  return (
    <div className="shrink-0 bg-background">
      <div className="flex items-center justify-between gap-3 px-4 py-2">
        <p className="text-xs font-medium text-muted-foreground">Timeline</p>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <MetaPill>{totalSeconds.toFixed(2)}s</MetaPill>
            <MetaPill>{fps}fps</MetaPill>
            <MetaPill>
              {project.width}×{project.height}
            </MetaPill>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => zoomBy(1 / ZOOM_STEP)}
              disabled={atMinZoom}
              title="Zoom out"
              aria-label="Zoom out"
            >
              <HugeiconsIcon icon={ZoomOutAreaIcon} className="size-3.5" />
            </Button>
            <button
              type="button"
              onClick={() => {
                setPxPerSecond(DEFAULT_PX_PER_SECOND);
              }}
              title="Reset zoom"
              className="min-w-10 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums hover:bg-muted hover:text-foreground"
            >
              {zoomPct}%
            </button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => zoomBy(ZOOM_STEP)}
              disabled={atMaxZoom}
              title="Zoom in"
              aria-label="Zoom in"
            >
              <HugeiconsIcon icon={ZoomInAreaIcon} className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div ref={scrollContainerRef} className="overflow-x-auto">
        <div
          ref={scrubAreaRef}
          style={{ minWidth: trackWidth + 32 }}
          className="relative w-full"
        >
          <TimeRuler
            ticks={ticks}
            pxPerSecond={pxPerSecond}
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
                  {project.clips.map((clip, index) => {
                    const layout = layouts[index]!;
                    const durationPx =
                      (clip.durationInFrames / fps) * pxPerSecond;
                    const leadingPx =
                      (layout.leadingFrames / fps) * pxPerSecond;
                    const trailingPx =
                      (layout.trailingFrames / fps) * pxPerSecond;
                    const bodyWidthPx = durationPx - leadingPx - trailingPx;

                    const next = project.clips[index + 1];
                    const showStrip =
                      next !== undefined && layout.trailingFrames > 0;
                    return (
                      <Fragment key={clip.id}>
                        <SortableClipBlock
                          clip={clip}
                          fps={fps}
                          framesPerPx={framesPerPx}
                          bodyWidthPx={bodyWidthPx}
                          selected={clip.id === selectedClipId}
                          onSelect={() => onSelect(clip.id)}
                          onDelete={() => onDelete(clip.id)}
                          onDurationChange={(d) => onDurationChange(clip.id, d)}
                        />
                        {showStrip && next && (
                          <TransitionStrip
                            transition={resolveTransition({
                              clipTransition: next.transition,
                              projectDefault: project.defaultTransition,
                              index: index + 1,
                            })}
                            prevPalette={paletteForCompositionId(
                              clip.compositionId,
                            )}
                            nextPalette={paletteForCompositionId(
                              next.compositionId,
                            )}
                            fps={fps}
                            widthPx={trailingPx}
                            framesPerPx={framesPerPx}
                            maxFrames={Math.min(
                              clip.durationInFrames,
                              next.durationInFrames,
                            )}
                            selected={next.id === selectedClipId}
                            onSelect={() => onSelectTransition(next.id)}
                            onResize={(durationInFrames) =>
                              onUpdateTransition(next.id, {
                                ...resolveTransition({
                                  clipTransition: next.transition,
                                  projectDefault: project.defaultTransition,
                                  index: index + 1,
                                }),
                                durationInFrames,
                              })
                            }
                          />
                        )}
                      </Fragment>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <Playhead fps={fps} pxPerSecond={pxPerSecond} />
        </div>
      </div>
    </div>
  );
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground tabular-nums">
      {children}
    </span>
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

function Playhead({ fps, pxPerSecond }: { fps: number; pxPerSecond: number }) {
  const frame = usePlayerFrame();
  const left = TRACK_PADDING_X + (frame / fps) * pxPerSecond;
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
