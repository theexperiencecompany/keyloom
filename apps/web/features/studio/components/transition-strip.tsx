"use client";

import type {
  SceneTransition,
  SceneTransitionKind,
} from "@workspace/compositions/transitions";
import type React from "react";
import { useState } from "react";
import type { ClipPalette } from "../lib/clip-colors";

const TRANSITION_GLYPH: Record<SceneTransitionKind, string> = {
  none: "·",
  fade: "◐",
  slide: "⇆",
  wipe: "▥",
  flip: "↻",
  "clock-wipe": "◷",
  iris: "◎",
  zoom: "⊕",
};

const TRANSITION_LABEL: Record<SceneTransitionKind, string> = {
  none: "Cut",
  fade: "Fade",
  slide: "Slide",
  wipe: "Wipe",
  flip: "Flip",
  "clock-wipe": "Clock",
  iris: "Iris",
  zoom: "Zoom",
};

const MIN_TRANSITION_FRAMES = 1;

type Props = {
  /** The transition object as it will play (already `resolveTransition`'d). */
  transition: SceneTransition;
  prevPalette: ClipPalette;
  nextPalette: ClipPalette;
  fps: number;
  /** Visual width of the strip in px (matches the actual overlap duration). */
  widthPx: number;
  /** Inverse of PX_PER_SECOND scaled to frames. */
  framesPerPx: number;
  /** Hard cap so the overlap never exceeds either neighbouring clip's length. */
  maxFrames: number;
  selected: boolean;
  onSelect: () => void;
  onResize: (durationInFrames: number) => void;
};

export function TransitionStrip({
  transition,
  prevPalette: _prevPalette,
  nextPalette: _nextPalette,
  fps,
  widthPx,
  framesPerPx,
  maxFrames,
  selected,
  onSelect,
  onResize,
}: Props) {
  const [resizing, setResizing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const seconds = transition.durationInFrames / fps;

  const showPill = widthPx >= 60;
  const showDot = !showPill && widthPx >= 18;

  function startResize(side: "left" | "right", e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);

    const startX = e.clientX;
    const startFrames = transition.durationInFrames;

    function onMove(ev: PointerEvent) {
      const deltaPx = ev.clientX - startX;
      const deltaFrames = Math.round(deltaPx * framesPerPx * 2);
      const next =
        side === "right"
          ? startFrames + deltaFrames
          : startFrames - deltaFrames;
      onResize(Math.max(MIN_TRANSITION_FRAMES, Math.min(maxFrames, next)));
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      setResizing(false);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  return (
    <div
      title={`${TRANSITION_LABEL[transition.kind]} · ${seconds.toFixed(2)}s`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={{ width: widthPx }}
      className="group/strip relative z-[5] shrink-0 self-stretch cursor-pointer"
    >
      {/* The strip card — a single rounded rectangle, full clip-block
          height, painted in the system blue so it reads as a discrete
          "transition" object rather than a clip. */}
      <div
        className="absolute inset-0 overflow-hidden rounded-sm transition-shadow"
        style={{
          background: "rgb(59,130,246)",
          boxShadow: selected
            ? "0 0 0 1.5px rgb(96,165,250), inset 0 1px 0 rgba(255,255,255,0.28), 0 2px 6px -2px rgba(0,0,0,0.5)"
            : hovered
              ? "inset 0 1px 0 rgba(255,255,255,0.32), inset 0 0 0 1px rgba(255,255,255,0.18), 0 2px 6px -2px rgba(0,0,0,0.45)"
              : "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 0 0 1px rgba(255,255,255,0.1), 0 1px 3px -1px rgba(0,0,0,0.4)",
        }}
      >
        {/* Centred badge — a small pill on wide strips, a glyph-only dot
            on narrow strips, nothing on extremely narrow ones. */}
        {showPill && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex items-center gap-1 rounded-full bg-black/55 px-1.5 py-px text-white drop-shadow-sm backdrop-blur-sm">
              <span className="text-[10px] leading-none">
                {TRANSITION_GLYPH[transition.kind]}
              </span>
              <span className="text-[8px] font-semibold uppercase leading-none tracking-wider">
                {TRANSITION_LABEL[transition.kind]}
              </span>
            </span>
          </div>
        )}
        {showDot && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="flex items-center justify-center rounded-full bg-black/55 text-[9px] leading-none text-white drop-shadow-sm backdrop-blur-sm"
              style={{ width: 14, height: 14 }}
            >
              {TRANSITION_GLYPH[transition.kind]}
            </span>
          </div>
        )}
      </div>

      <ResizeEdge
        side="left"
        active={resizing || hovered}
        onPointerDown={(e) => startResize("left", e)}
      />
      <ResizeEdge
        side="right"
        active={resizing || hovered}
        onPointerDown={(e) => startResize("right", e)}
      />
    </div>
  );
}

function ResizeEdge({
  side,
  active,
  onPointerDown,
}: {
  side: "left" | "right";
  active: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  return (
    <div
      onPointerDown={onPointerDown}
      onClick={(e) => e.stopPropagation()}
      className={`absolute top-0 z-10 flex h-full w-2 cursor-ew-resize items-center justify-center ${
        side === "left" ? "-left-1" : "-right-1"
      }`}
    >
      <span
        className={`h-3.5 w-[2px] rounded-full bg-white/95 shadow-[0_0_4px_rgba(0,0,0,0.5)] transition-opacity ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
