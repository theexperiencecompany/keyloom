"use client";

import {
  Add01Icon,
  Delete02Icon,
  DragDropIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Player } from "@remotion/player";
import { componentsById } from "@workspace/compositions/components";
import { compositionsById } from "@workspace/compositions/registry";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { AbsoluteFill } from "remotion";

// ── Canvas constants ────────────────────────────────────────────────────────
// A vertical short. The composition is authored in these pixel dimensions;
// the Player scales it to fit the displayed stage, and every coordinate the
// overlay deals with is in this composition space (then multiplied by `scale`
// to land on screen).
const COMP_W = 1080;
const COMP_H = 1920;
const FPS = 30;
const DURATION = 150;

// Compositions a creator can drop onto the canvas in this demo. Any id from
// the registry works — these are just the seedable picks for the toolbar.
const PICKERS = ["Text", "StatCounter"] as const;

type Layer = {
  id: string;
  compositionId: string;
  props: Record<string, unknown>;
  // All in composition space (0..COMP_W / 0..COMP_H).
  x: number;
  y: number;
  width: number;
  height: number;
};

let layerSeq = 0;
function makeLayer(
  compositionId: string,
  box: Pick<Layer, "x" | "y" | "width" | "height">,
): Layer {
  const info = compositionsById[compositionId];
  layerSeq += 1;
  return {
    id: `layer-${layerSeq}`,
    compositionId,
    props: { ...(info?.defaultProps ?? {}) },
    ...box,
  };
}

const INITIAL_LAYERS: Layer[] = [
  makeLayer("Text", { x: 90, y: 150, width: 900, height: 420 }),
  makeLayer("StatCounter", { x: 240, y: 760, width: 600, height: 400 }),
];

// ── The composition rendered INSIDE the Player ───────────────────────────────
// This is the entire trick: each composition still renders exactly as it was
// authored (full-bleed AbsoluteFill, self-centering), but because we drop it
// into an absolutely-positioned, sized box, its AbsoluteFill fills *the box*
// instead of the whole frame. No per-composition changes needed. We force a
// transparent background so the graphic floats over the "video" beneath.
function DragStage({ layers }: { layers: Layer[] }) {
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(120% 120% at 50% 0%, #1b2440 0%, #0a0a0f 60%, #050507 100%)",
      }}
    >
      {/* Stand-in for the creator's uploaded video. */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.06)",
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: 4,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        YOUR VIDEO
      </AbsoluteFill>

      {layers.map((layer) => {
        const Component = componentsById[layer.compositionId];
        if (!Component) return null;
        return (
          <div
            key={layer.id}
            style={{
              position: "absolute",
              left: layer.x,
              top: layer.y,
              width: layer.width,
              height: layer.height,
            }}
          >
            <Component
              {...layer.props}
              clipStyle={{ background: "transparent" }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

// ── Drag math ────────────────────────────────────────────────────────────────
type DragMode = "move" | "nw" | "ne" | "sw" | "se";
const MIN_SIZE = 120; // composition px

type DragState = {
  mode: DragMode;
  pointerId: number;
  /** Screen px per composition px, captured at grab time (stage can't resize mid-drag). */
  pxScale: number;
  startClientX: number;
  startClientY: number;
  start: Pick<Layer, "x" | "y" | "width" | "height">;
};

function applyDrag(
  start: Pick<Layer, "x" | "y" | "width" | "height">,
  mode: DragMode,
  dx: number, // already in composition space
  dy: number,
): Pick<Layer, "x" | "y" | "width" | "height"> {
  if (mode === "move") {
    return { ...start, x: start.x + dx, y: start.y + dy };
  }
  let { x, y, width, height } = start;
  const movesLeft = mode === "nw" || mode === "sw";
  const movesTop = mode === "nw" || mode === "ne";
  if (movesLeft) {
    width = start.width - dx;
    if (width < MIN_SIZE) width = MIN_SIZE;
    x = start.x + (start.width - width);
  } else {
    width = Math.max(MIN_SIZE, start.width + dx);
  }
  if (movesTop) {
    height = start.height - dy;
    if (height < MIN_SIZE) height = MIN_SIZE;
    y = start.y + (start.height - height);
  } else {
    height = Math.max(MIN_SIZE, start.height + dy);
  }
  return { x, y, width, height };
}

// ── The interactive overlay (HTML, sits on top of the Player) ────────────────
const HANDLES: { mode: Exclude<DragMode, "move">; cls: string }[] = [
  {
    mode: "nw",
    cls: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
  },
  {
    mode: "ne",
    cls: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
  },
  {
    mode: "sw",
    cls: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
  },
  {
    mode: "se",
    cls: "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
  },
];

export function DragDropDemo() {
  const [layers, setLayers] = useState<Layer[]>(INITIAL_LAYERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const inputProps = useMemo(() => ({ layers }), [layers]);

  const updateLayer = useCallback((id: string, box: Partial<Layer>) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...box } : l)));
  }, []);

  const onHandlePointerDown = useCallback(
    (e: ReactPointerEvent, layer: Layer, mode: DragMode) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedId(layer.id);
      (e.target as Element).setPointerCapture?.(e.pointerId);
      // Read the stage size once, here, rather than tracking it in state: it
      // can't change while a pointer is held, so a ResizeObserver/effect would
      // be dead weight.
      const stageWidth = stageRef.current?.clientWidth ?? COMP_W;
      dragRef.current = {
        mode,
        pointerId: e.pointerId,
        pxScale: stageWidth / COMP_W,
        startClientX: e.clientX,
        startClientY: e.clientY,
        start: {
          x: layer.x,
          y: layer.y,
          width: layer.width,
          height: layer.height,
        },
      };
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId || !selectedId) return;
      const dx = (e.clientX - drag.startClientX) / drag.pxScale;
      const dy = (e.clientY - drag.startClientY) / drag.pxScale;
      updateLayer(selectedId, applyDrag(drag.start, drag.mode, dx, dy));
    },
    [selectedId, updateLayer],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  const addLayer = useCallback((compositionId: string) => {
    const box = {
      x: COMP_W * 0.12,
      y: COMP_H * 0.4,
      width: COMP_W * 0.76,
      height: COMP_H * 0.2,
    };
    const layer = makeLayer(compositionId, box);
    setLayers((prev) => [...prev, layer]);
    setSelectedId(layer.id);
  }, []);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setLayers((prev) => prev.filter((l) => l.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <div className="mr-2 flex items-center gap-2 text-sm font-medium">
          <HugeiconsIcon icon={DragDropIcon} size={18} />
          Drag &amp; Drop prototype
        </div>
        {PICKERS.map((id) => (
          <Button
            key={id}
            size="sm"
            variant="outline"
            onClick={() => addLayer(id)}
          >
            <HugeiconsIcon icon={Add01Icon} size={14} />
            {compositionsById[id]?.title ?? id}
          </Button>
        ))}
        <div className="flex-1" />
        <Button
          size="sm"
          variant="ghost"
          disabled={!selectedId}
          onClick={deleteSelected}
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} />
          Delete
        </Button>
      </div>

      {/* Stage */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div
          ref={stageRef}
          className="relative overflow-hidden rounded-xl bg-black ring-1 ring-border"
          style={{
            aspectRatio: `${COMP_W} / ${COMP_H}`,
            height: "min(82vh, 880px)",
            touchAction: "none",
            userSelect: "none",
          }}
        >
          <Player
            component={DragStage}
            inputProps={inputProps}
            durationInFrames={DURATION}
            fps={FPS}
            compositionWidth={COMP_W}
            compositionHeight={COMP_H}
            style={{ width: "100%", height: "100%" }}
            loop
            numberOfSharedAudioTags={12}
            acknowledgeRemotionLicense
          />

          {/* Interaction overlay — exactly the Player's box, so layer
              positions map straight to percentages (no scale factor needed). */}
          <div
            className="absolute inset-0"
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerDown={() => setSelectedId(null)}
          >
            {layers.map((layer) => {
              const selected = layer.id === selectedId;
              // A drag surface, not a button — pointer-driven, no click semantics.
              return (
                <div
                  key={layer.id}
                  className={cn(
                    "absolute cursor-move outline-none",
                    selected
                      ? "ring-2 ring-sky-400"
                      : "ring-1 ring-white/25 hover:ring-white/50",
                  )}
                  style={{
                    left: `${(layer.x / COMP_W) * 100}%`,
                    top: `${(layer.y / COMP_H) * 100}%`,
                    width: `${(layer.width / COMP_W) * 100}%`,
                    height: `${(layer.height / COMP_H) * 100}%`,
                  }}
                  onPointerDown={(e) => onHandlePointerDown(e, layer, "move")}
                >
                  {selected &&
                    HANDLES.map((h) => (
                      <div
                        key={h.mode}
                        className={cn(
                          "absolute size-3 rounded-full border border-sky-400 bg-background",
                          h.cls,
                        )}
                        onPointerDown={(e) =>
                          onHandlePointerDown(e, layer, h.mode)
                        }
                      />
                    ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="px-6 pb-6 text-center text-xs text-muted-foreground">
        Drag any graphic to reposition, grab a corner to resize, click empty
        space to deselect, use the Delete button to remove. Each box renders a
        real registry composition — unchanged — over the &ldquo;video&rdquo;
        beneath it.
      </p>
    </div>
  );
}
