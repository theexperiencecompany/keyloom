"use client";

import {
  Cancel01Icon,
  MultiplicationSignIcon,
  MusicNote01Icon,
  PauseCircleIcon,
  PlayCircleIcon,
  PlusSignIcon,
  Search01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ProjectAudio } from "@workspace/compositions/project";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { AudioSearchState, AudioTrack } from "../hooks/use-audio-search";

type Props = {
  currentAudio?: ProjectAudio;
  audioSearch: AudioSearchState;
  onSet: (audio: ProjectAudio) => void;
  onClear: () => void;
  onClose: () => void;
};

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export function UploadPanel({
  currentAudio,
  audioSearch,
  onSet,
  onClear,
  onClose,
}: Props) {
  const {
    query,
    setQuery,
    debouncedQuery,
    tracks,
    loading,
    error,
    setError,
    missingKey,
  } = audioSearch;
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Single shared preview element — only one track may play at a time.
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Tear down the preview audio when the panel unmounts.
  useEffect(() => {
    return () => {
      const a = previewRef.current;
      if (a) {
        a.pause();
        a.src = "";
      }
    };
  }, []);

  function togglePreview(track: AudioTrack) {
    if (typeof window === "undefined") return;

    // Clicking the row that's already playing pauses it.
    if (playingId === track.id) {
      previewRef.current?.pause();
      previewRef.current = null;
      setPlayingId(null);
      return;
    }

    // Reusing a single Audio element across src swaps is fragile — on
    // some browsers the `play()` promise rejects mid-swap and the UI
    // silently flips back to "stopped". Create a fresh element per
    // preview so each play is a clean state machine.
    if (previewRef.current) {
      previewRef.current.pause();
      previewRef.current.src = "";
      previewRef.current = null;
    }

    const audio = new Audio(track.previewUrl);
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.onended = () => {
      if (previewRef.current === audio) {
        previewRef.current = null;
        setPlayingId(null);
      }
    };
    audio.onerror = () => {
      if (previewRef.current === audio) {
        previewRef.current = null;
        setPlayingId(null);
      }
    };

    previewRef.current = audio;
    setPlayingId(track.id);
    audio.play().catch(() => {
      // Only reset if this attempt is still the active one — a later
      // click might have already replaced previewRef.current.
      if (previewRef.current === audio) {
        previewRef.current = null;
        setPlayingId(null);
      }
    });
  }

  function chooseTrack(track: AudioTrack) {
    const base: ProjectAudio = {
      src: track.downloadUrl,
      title: track.title,
      attribution: track.user ? `Pixabay · ${track.user}` : "Pixabay",
      volume: currentAudio?.volume ?? 0.5,
      trimStartSec: 0,
      startFrame: 0,
      fadeInFrames: currentAudio?.fadeInFrames ?? 15,
      fadeOutFrames: currentAudio?.fadeOutFrames ?? 30,
      loop: currentAudio?.loop ?? false,
    };
    // Pixabay results already report the track length — store it on the
    // project so the trim-start slider in the inspector knows its upper
    // bound without re-decoding the file.
    if (track.duration > 0) base.sourceDurationSec = track.duration;
    onSet(base);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(
        `Upload is ${(file.size / 1024 / 1024).toFixed(1)} MB. Large files (>25 MB) may slow exports.`,
      );
    }
    // NOTE: `blob:` URLs survive only within this browser session. They
    // work for live preview and the in-browser MP4 export, but won't
    // survive a page reload or be reachable from a CLI render. Users
    // wanting persistent audio should pick a Pixabay track (URL stable)
    // or host their MP3 themselves and paste the URL into the JSON.
    const url = URL.createObjectURL(file);
    // Decode the file's duration via an off-screen <audio> element. The
    // duration is needed so the inspector's trim slider has a meaningful
    // upper bound; without it the user only gets a free-form number input.
    // We don't block the upload on metadata — if decoding fails (corrupt
    // mp3, format the browser refuses) we still attach the audio.
    const sourceDurationSec = await decodeAudioDuration(url).catch(() => 0);
    const audio: ProjectAudio = {
      src: url,
      title: file.name,
      volume: currentAudio?.volume ?? 0.5,
      trimStartSec: 0,
      startFrame: 0,
      fadeInFrames: currentAudio?.fadeInFrames ?? 15,
      fadeOutFrames: currentAudio?.fadeOutFrames ?? 30,
      loop: currentAudio?.loop ?? false,
    };
    if (sourceDurationSec > 0) audio.sourceDurationSec = sourceDurationSec;
    onSet(audio);
    // Allow re-selecting the same file later.
    e.target.value = "";
  }

  const emptyMessage = useMemo(() => {
    if (loading) return "Loading…";
    if (missingKey) {
      return "Add PIXABAY_API_KEY to .env.local to browse Pixabay's royalty-free music. You can still upload your own MP3.";
    }
    if (tracks.length === 0) return "No tracks found.";
    return null;
  }, [loading, missingKey, tracks.length]);

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden border-r border-border bg-background">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div>
          <p className="text-sm font-medium text-foreground">Upload</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Audio assets</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="size-6"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
        </Button>
      </div>

      {currentAudio && (
        <div className="mx-3 mt-3 flex items-center gap-2 px-1">
          <p
            className="min-w-0 flex-1 truncate text-[12px] font-medium text-foreground"
            title={currentAudio.title || currentAudio.src}
          >
            {currentAudio.title?.trim() || "Audio"}
          </p>
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            title="Remove attached audio"
            aria-label="Remove attached audio"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
          </button>
        </div>
      )}

      <div className="space-y-2 px-3 pb-2 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Audio
        </p>
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search royalty-free music…"
            className="h-8 rounded-md pl-8 text-xs"
            style={{ paddingRight: query ? "2rem" : undefined }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none"
              aria-label="Clear search"
            >
              <HugeiconsIcon icon={MultiplicationSignIcon} className="size-3" />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <HugeiconsIcon icon={Upload01Icon} className="size-4" />
          Upload MP3
        </Button>
        <input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          accept="audio/mpeg,audio/mp3,.mp3"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-3 pb-3">
        <p className="sticky top-0 z-[1] bg-background pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {debouncedQuery ? "Results" : "Popular tracks"}
        </p>
        {emptyMessage ? (
          <p className="rounded-md border border-dashed border-border/60 px-3 py-4 text-center text-[11px] leading-relaxed text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <ul className="space-y-1">
            {tracks.map((t) => (
              <TrackRow
                key={t.id}
                track={t}
                playing={playingId === t.id}
                onTogglePreview={() => togglePreview(t)}
                onChoose={() => chooseTrack(t)}
              />
            ))}
          </ul>
        )}
        {error && !missingKey && (
          <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
            {error}
          </p>
        )}
      </div>
    </aside>
  );
}

function TrackRow({
  track,
  playing,
  onTogglePreview,
  onChoose,
}: {
  track: AudioTrack;
  playing: boolean;
  onTogglePreview: () => void;
  onChoose: () => void;
}) {
  return (
    <li className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40">
      <button
        type="button"
        onClick={onTogglePreview}
        aria-label={playing ? "Pause preview" : "Play preview"}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <HugeiconsIcon
          icon={playing ? PauseCircleIcon : PlayCircleIcon}
          className="size-5"
        />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium text-foreground">
          {track.title}
        </p>
        <p className="truncate text-[10px] text-muted-foreground">
          {formatDuration(track.duration)}
          {track.user ? ` · ${track.user}` : ""}
        </p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 gap-1 px-2 text-[11px]"
        onClick={onChoose}
      >
        <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
        Use
      </Button>
    </li>
  );
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "--:--";
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Decode the duration of an audio resource by mounting it in a detached
 * `<audio>` element and waiting for the `loadedmetadata` event. Resolves
 * with the duration in seconds, or `0` if the browser couldn't decode the
 * file (corrupt mp3, exotic codec, etc.). 5s safety timeout — uploads
 * shouldn't hang on a stuck metadata fetch.
 */
function decodeAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    if (typeof Audio === "undefined") {
      resolve(0);
      return;
    }
    const probe = new Audio();
    probe.preload = "metadata";
    let settled = false;
    const finish = (value: number) => {
      if (settled) return;
      settled = true;
      probe.src = "";
      resolve(value);
    };
    const timer = window.setTimeout(() => finish(0), 5_000);
    probe.addEventListener("loadedmetadata", () => {
      window.clearTimeout(timer);
      const d = probe.duration;
      finish(Number.isFinite(d) && d > 0 ? d : 0);
    });
    probe.addEventListener("error", () => {
      window.clearTimeout(timer);
      finish(0);
    });
    probe.src = url;
  });
}

// Provide the HugeIcons music marker for downstream imports that want a
// consistent icon for the audio asset button.
export const UPLOAD_AUDIO_ICON = MusicNote01Icon;
