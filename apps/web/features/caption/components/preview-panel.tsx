"use client";

import { CloudUploadIcon, Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Player, type PlayerRef } from "@remotion/player";
import { CaptionedVideo } from "@workspace/compositions/compositions/CaptionedVideo/CaptionedVideo";
import { FONTS } from "@workspace/compositions/compositions/TikTokCaption/config";
import type { CaptionWord } from "@workspace/compositions/compositions/TikTokCaption/TikTokCaption";
import { Button } from "@workspace/ui/components/button";
import { RaisedButton } from "@workspace/ui/components/raised-button";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/download-blob";
import type { VideoMeta } from "../lib/editor";
import { CAPTION_FPS, exportCaptionedVideo } from "../lib/export";
import { FILTERS_BY_ID } from "../lib/filters";
import type { CaptionStyle } from "./caption-editor";
import { PlayerControls } from "./player-controls";
import {
  FilterPopover,
  MusicPopover,
  type MusicTrack,
} from "./preview-toolbar";

const NO_CUTS: { start: number; end: number }[] = [];

export function PreviewPanel({
  video,
  words,
  style,
  music,
  onStyle,
  onMusic,
  onPlayhead,
  seekRequestRef,
  onReplaceVideo,
}: {
  video: VideoMeta;
  words: CaptionWord[];
  style: CaptionStyle;
  music: MusicTrack | null;
  onStyle: (patch: Partial<CaptionStyle>) => void;
  onMusic: (music: MusicTrack | null) => void;
  onPlayhead: (seconds: number) => void;
  seekRequestRef: React.MutableRefObject<((seconds: number) => void) | null>;
  onReplaceVideo: (file: File) => void;
}) {
  const playerRef = useRef<PlayerRef>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const durationInFrames = Math.max(
    1,
    Math.round(video.duration * CAPTION_FPS),
  );

  const inputProps = useMemo(
    () => ({
      src: video.url,
      durationSec: video.duration,
      words,
      cuts: NO_CUTS,
      videoFilter: FILTERS_BY_ID[style.filterId]?.css,
      music: music ? { src: music.src, volume: music.volume } : null,
      captionVAlign: style.vAlign,
      captionHAlign: style.hAlign,
      captionPos: style.position,
      captionWidth: style.width,
      fontScale: style.fontScale,
      maxWordsPerPhrase: style.wordsPerCaption,
      clipTheme: style.themeId,
      clipStyle: {
        background: "transparent",
        color: style.textColor,
        fontFamily: FONTS[style.fontKey].cssFamily,
        accent: style.accentColor,
      },
    }),
    [video, words, style, music],
  );

  // Edit affordances (drag to move, corner handles to resize) live only on
  // the Player's props — inputProps stays serializable for the export path.
  const playerProps = useMemo(
    () => ({
      ...inputProps,
      editMode: true,
      onCaptionMove: (position: { x: number; y: number }) =>
        onStyle({ position }),
      onCaptionScale: (fontScale: number) => onStyle({ fontScale }),
      onCaptionWidth: (width: number) => onStyle({ width }),
    }),
    [inputProps, onStyle],
  );

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const onFrame = (e: { detail: { frame: number } }) => {
      // Quantized so most frames hit React's same-value bailout — the
      // segments list only highlights per word, and re-rendering the whole
      // editor at 30fps makes playback stutter.
      onPlayhead(Math.round((e.detail.frame / CAPTION_FPS) * 20) / 20);
    };
    player.addEventListener("frameupdate", onFrame);
    return () => {
      player.removeEventListener("frameupdate", onFrame);
    };
  }, [onPlayhead]);

  useEffect(() => {
    seekRequestRef.current = (seconds: number) => {
      playerRef.current?.seekTo(Math.round(seconds * CAPTION_FPS));
    };
    return () => {
      seekRequestRef.current = null;
    };
  }, [seekRequestRef]);

  const handleExport = async () => {
    if (exportProgress != null) {
      abortRef.current?.abort();
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setExportProgress(0);
    playerRef.current?.pause();
    try {
      const { blob, filename } = await exportCaptionedVideo({
        props: inputProps,
        width: video.width,
        height: video.height,
        durationInFrames,
        signal: controller.signal,
        onProgress: setExportProgress,
      });
      downloadBlob(blob, filename);
      toast.success("MP4 exported");
    } catch (e) {
      if (!controller.signal.aborted) {
        toast.error(e instanceof Error ? e.message : "Export failed");
      }
    } finally {
      setExportProgress(null);
      abortRef.current = null;
    }
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <MusicPopover music={music} onChange={onMusic} />
        <FilterPopover
          filterId={style.filterId}
          videoSrc={video.url}
          onChange={(filterId) => onStyle({ filterId })}
        />
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => replaceInputRef.current?.click()}
          >
            <HugeiconsIcon icon={CloudUploadIcon} size={15} />
            Replace video
          </Button>
          <RaisedButton
            size="sm"
            onClick={handleExport}
            className="h-8 min-w-28"
          >
            {exportProgress != null ? (
              `Cancel · ${Math.round(exportProgress * 100)}%`
            ) : (
              <>
                <HugeiconsIcon icon={Download01Icon} size={15} />
                Export MP4
              </>
            )}
          </RaisedButton>
          <input
            ref={replaceInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onReplaceVideo(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/30">
        <Player
          ref={playerRef}
          component={CaptionedVideo}
          inputProps={playerProps}
          durationInFrames={durationInFrames}
          fps={CAPTION_FPS}
          compositionWidth={video.width}
          compositionHeight={video.height}
          style={{ width: "100%", height: "100%" }}
          clickToPlay={false}
          spaceKeyToPlayOrPause
          acknowledgeRemotionLicense
        />
      </div>

      <div className="mx-auto w-full max-w-xl">
        <PlayerControls
          playerRef={playerRef}
          durationInFrames={durationInFrames}
          fps={CAPTION_FPS}
        />
      </div>
    </section>
  );
}
