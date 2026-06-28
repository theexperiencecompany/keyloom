"use client";

import {
  PauseIcon,
  PlayIcon,
  VolumeHighIcon,
  VolumeMute02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Slider } from "@workspace/ui/components/slider";
import type Konva from "konva";
import type { RefObject } from "react";
import { useEffect } from "react";
import {
  Image as KonvaImage,
  Text as KonvaText,
  Layer,
  Rect,
  Stage,
  Transformer,
} from "react-konva";
import {
  type Caption,
  coverCrop,
  type NodeAttrs,
  OUTPUT_HEIGHT,
  OUTPUT_WIDTH,
  type Selected,
  type TextAttrs,
} from "./meme-layout";

const overlayBtn =
  "flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70 disabled:opacity-50";

type MemeCanvasProps = {
  /** CSS scale that fits the 1080x1920 stage into the preview box. */
  displayScale: number;
  bgImg: HTMLImageElement | null;
  videoEl: HTMLVideoElement | null;
  vsize: { w: number; h: number };
  videoAttrs: NodeAttrs;
  textAttrs: TextAttrs;
  caption: Caption;
  selected: Selected;
  onSelect: (s: Selected) => void;
  exporting: boolean;
  onSyncVideo: () => void;
  onSyncText: () => void;
  // Preview transport controls.
  playing: boolean;
  muted: boolean;
  volume: number;
  audioAvailable: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  // Konva refs owned by the parent (needed for export + transforms).
  layerRef: RefObject<Konva.Layer | null>;
  videoNodeRef: RefObject<Konva.Image | null>;
  textNodeRef: RefObject<Konva.Text | null>;
  trRef: RefObject<Konva.Transformer | null>;
};

/** The 9:16 preview: background + subject clip + caption, with transport controls. */
export function MemeCanvas({
  displayScale,
  bgImg,
  videoEl,
  vsize,
  videoAttrs,
  textAttrs,
  caption,
  selected,
  onSelect,
  exporting,
  onSyncVideo,
  onSyncText,
  playing,
  muted,
  volume,
  audioAvailable,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  layerRef,
  videoNodeRef,
  textNodeRef,
  trRef,
}: MemeCanvasProps) {
  const fontStyle = caption.fontWeight >= 600 ? "bold" : "normal";

  // Attach the Transformer to the selected node.
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const node =
      selected === "video"
        ? videoNodeRef.current
        : selected === "text"
          ? textNodeRef.current
          : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selected, videoEl, trRef, videoNodeRef, textNodeRef]);

  return (
    <div
      className="relative"
      style={{
        width: OUTPUT_WIDTH * displayScale,
        height: OUTPUT_HEIGHT * displayScale,
      }}
    >
      {/* Transport overlay — pinned to the video's top-right. */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
        {audioAvailable && (
          <div className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-2 text-white backdrop-blur-sm">
            <button
              type="button"
              onClick={onToggleMute}
              disabled={exporting}
              aria-label={muted ? "Unmute" : "Mute"}
              className="flex shrink-0 items-center disabled:opacity-50"
            >
              <HugeiconsIcon
                icon={muted ? VolumeMute02Icon : VolumeHighIcon}
                size={16}
              />
            </button>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[muted ? 0 : Math.round(volume * 100)]}
              onValueChange={([v]) => onVolumeChange((v ?? 0) / 100)}
              disabled={exporting}
              aria-label="Volume"
              className="w-20"
            />
          </div>
        )}
        <button
          type="button"
          onClick={onTogglePlay}
          disabled={exporting}
          aria-label={playing ? "Pause" : "Play"}
          className={overlayBtn}
        >
          <HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} size={16} />
        </button>
      </div>

      <div
        style={{
          width: OUTPUT_WIDTH,
          height: OUTPUT_HEIGHT,
          transform: `scale(${displayScale})`,
          transformOrigin: "top left",
        }}
      >
        <Stage
          width={OUTPUT_WIDTH}
          height={OUTPUT_HEIGHT}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) onSelect(null);
          }}
          onTouchStart={(e) => {
            if (e.target === e.target.getStage()) onSelect(null);
          }}
        >
          <Layer ref={layerRef}>
            {bgImg ? (
              <KonvaImage
                image={bgImg}
                width={OUTPUT_WIDTH}
                height={OUTPUT_HEIGHT}
                crop={coverCrop(bgImg)}
                listening={false}
              />
            ) : (
              <Rect
                width={OUTPUT_WIDTH}
                height={OUTPUT_HEIGHT}
                fill="#000000"
                listening={false}
              />
            )}

            {videoEl && (
              <KonvaImage
                ref={videoNodeRef}
                image={videoEl}
                width={vsize.w}
                height={vsize.h}
                x={videoAttrs.x}
                y={videoAttrs.y}
                scaleX={videoAttrs.scaleX}
                scaleY={videoAttrs.scaleY}
                rotation={videoAttrs.rotation}
                draggable={!exporting}
                onMouseDown={() => onSelect("video")}
                onTap={() => onSelect("video")}
                onDragEnd={onSyncVideo}
                onTransformEnd={onSyncVideo}
              />
            )}

            <KonvaText
              ref={textNodeRef}
              text={caption.text}
              x={textAttrs.x}
              y={textAttrs.y}
              width={textAttrs.width}
              scaleX={textAttrs.scaleX}
              scaleY={textAttrs.scaleY}
              rotation={textAttrs.rotation}
              fontFamily={caption.fontFamily}
              fontSize={caption.fontSize}
              fontStyle={fontStyle}
              fill={caption.color}
              stroke="#000000"
              strokeWidth={caption.stroke}
              fillAfterStrokeEnabled
              lineHeight={1.05}
              align="center"
              draggable={!exporting}
              onMouseDown={() => onSelect("text")}
              onTap={() => onSelect("text")}
              onDragEnd={onSyncText}
              onTransformEnd={onSyncText}
            />
          </Layer>

          <Layer>
            <Transformer
              ref={trRef}
              rotateEnabled
              keepRatio={false}
              ignoreStroke
              anchorSize={18}
              borderStrokeWidth={2}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
