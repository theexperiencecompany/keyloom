"use client";

import {
  ArrowDataTransferVerticalIcon,
  CloudUploadIcon,
  Download01Icon,
  LayoutTwoRowIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Player, type PlayerRef } from "@remotion/player";
import { SplitStack } from "@workspace/compositions/compositions/SplitStack/SplitStack";
import { Button } from "@workspace/ui/components/button";
import { Slider } from "@workspace/ui/components/slider";
import { WaveSpinner } from "@workspace/ui/components/wave-spinner";
import { cn } from "@workspace/ui/lib/utils";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PlayerControls } from "@/features/caption/components/player-controls";
import { probeVideo, type VideoMeta } from "@/features/caption/lib/editor";
import { downloadBlob } from "@/lib/download-blob";
import { exportSplitVideo, SPLIT_FPS } from "../lib/export";
import { ClipRail, type GameplayClip, useGameplayClips } from "./clip-rail";

export function SplitMaker() {
  const [video, setVideo] = useState<VideoMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clip, setClip] = useState<GameplayClip | null>(null);
  const [split, setSplit] = useState(0.5);
  const [userOnTop, setUserOnTop] = useState(true);
  const { data: clips = [], isPending } = useGameplayClips();

  const handleFile = useCallback(
    async (file: File) => {
      const url = URL.createObjectURL(file);
      try {
        const meta = await probeVideo(url);
        if (video) URL.revokeObjectURL(video.url);
        setVideo({ url, ...meta, filename: file.name });
        setError(null);
      } catch (e) {
        URL.revokeObjectURL(url);
        const message =
          e instanceof Error ? e.message : "That file couldn't be read.";
        setError(message);
        toast.error(message);
      }
    },
    [video],
  );

  const selected = clip ?? clips[0] ?? null;

  if (!video) {
    return <UploadStage error={error} onFile={handleFile} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col gap-3 overflow-y-auto lg:w-64">
        <div>
          <h2 className="text-sm font-medium">Gameplay</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pick the clip for the other half.
          </p>
        </div>
        <ClipRail
          clips={clips}
          isPending={isPending}
          selectedId={selected?.id ?? null}
          onSelect={setClip}
        />
      </aside>

      <SplitPreview
        video={video}
        clip={selected}
        split={split}
        userOnTop={userOnTop}
        onSplit={setSplit}
        onSwap={() => setUserOnTop((v) => !v)}
        onReplaceVideo={handleFile}
      />
    </div>
  );
}

function SplitPreview({
  video,
  clip,
  split,
  userOnTop,
  onSplit,
  onSwap,
  onReplaceVideo,
}: {
  video: VideoMeta;
  clip: GameplayClip | null;
  split: number;
  userOnTop: boolean;
  onSplit: (split: number) => void;
  onSwap: () => void;
  onReplaceVideo: (file: File) => void;
}) {
  const playerRef = useRef<PlayerRef>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const durationInFrames = Math.max(1, Math.round(video.duration * SPLIT_FPS));

  const inputProps = useMemo(
    () =>
      clip ? { userSrc: video.url, gameSrc: clip.src, split, userOnTop } : null,
    [video.url, clip, split, userOnTop],
  );

  const handleExport = async () => {
    if (exportProgress != null) {
      abortRef.current?.abort();
      return;
    }
    if (!inputProps) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setExportProgress(0);
    playerRef.current?.pause();
    try {
      const { blob, filename } = await exportSplitVideo({
        props: inputProps,
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-muted-foreground">
            Split
          </span>
          <Slider
            value={[split]}
            min={0.3}
            max={0.7}
            step={0.01}
            onValueChange={([v]) => onSplit(v ?? 0.5)}
            className="w-36"
          />
          <span className="w-9 font-mono text-xs text-muted-foreground">
            {Math.round(split * 100)}%
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={onSwap}>
          <HugeiconsIcon icon={ArrowDataTransferVerticalIcon} size={15} />
          {userOnTop ? "You on top" : "Gameplay on top"}
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => replaceInputRef.current?.click()}
          >
            <HugeiconsIcon icon={CloudUploadIcon} size={15} />
            Replace video
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={!inputProps}
            className="min-w-28"
          >
            {exportProgress != null ? (
              `Cancel · ${Math.round(exportProgress * 100)}%`
            ) : (
              <>
                <HugeiconsIcon icon={Download01Icon} size={15} />
                Export MP4
              </>
            )}
          </Button>
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
        {inputProps ? (
          <Player
            ref={playerRef}
            component={SplitStack}
            inputProps={inputProps}
            durationInFrames={durationInFrames}
            fps={SPLIT_FPS}
            compositionWidth={1080}
            compositionHeight={1920}
            style={{ width: "100%", height: "100%" }}
            clickToPlay={false}
            spaceKeyToPlayOrPause
            acknowledgeRemotionLicense
            showPosterWhenBuffering
            renderPoster={() => (
              <div className="flex h-full w-full items-center justify-center bg-black/60">
                <WaveSpinner />
              </div>
            )}
          />
        ) : (
          <p className="max-w-xs px-6 text-center text-sm text-muted-foreground">
            Pick a gameplay clip from the left to build your split screen.
          </p>
        )}
      </div>

      <PlayerControls
        playerRef={playerRef}
        durationInFrames={durationInFrames}
        fps={SPLIT_FPS}
      />
    </section>
  );
}

function UploadStage({
  error,
  onFile,
}: {
  error: string | null;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <div className="w-full max-w-lg">
        <div className="mb-8 space-y-2 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
            <HugeiconsIcon icon={LayoutTwoRowIcon} size={24} />
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Make a split screen
          </h1>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Drop your talking-head video, pair it with a gameplay clip, and
            export a 9:16 split-screen MP4.
          </p>
        </div>

        {/* biome-ignore lint/a11y/useSemanticElements: drop-zone needs drag-and-drop events that a native <button> swallows */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) onFile(dropped);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            dragging
              ? "border-primary/60 bg-primary/5"
              : "border-border bg-card/50 hover:border-muted-foreground/40",
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-background shadow-sm">
            <HugeiconsIcon icon={CloudUploadIcon} size={22} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Drop a video here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              MP4 or WebM · it never leaves your browser
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            Choose video
          </Button>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
