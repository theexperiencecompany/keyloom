"use client";

import { Cancel01Icon, MusicNote01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ProjectAudio } from "@workspace/compositions/project";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Slider } from "@workspace/ui/components/slider";
import { Switch } from "@workspace/ui/components/switch";
import { useId } from "react";

type Props = {
  audio: ProjectAudio;
  fps: number;
  videoDurationFrames: number;
  /** Length of the source mp3 in seconds, if known (Pixabay results). */
  sourceDurationSec?: number;
  onPatch: (patch: Partial<ProjectAudio>) => void;
  onClear: () => void;
  onOpenLibrary: () => void;
};

/**
 * Sits in the right inspector rail when no clip is selected — same slot
 * `ProjectTransitionControl` lives in via the top bar. Exposes the full
 * audio control surface: master volume (in dB), playback duration cap
 * (clamped to video length), loop, trim-start, fade-in, fade-out.
 */
export function ProjectAudioControl({
  audio,
  fps,
  videoDurationFrames,
  sourceDurationSec,
  onPatch,
  onClear,
  onOpenLibrary,
}: Props) {
  const ids = {
    volume: useId(),
    duration: useId(),
    loop: useId(),
    trim: useId(),
    fadeIn: useId(),
    fadeOut: useId(),
  };

  const peak = clamp01(audio.volume);
  const dbLabel = formatDb(peak);

  // Playback duration (frames), clamped to project length so audio never
  // outlives the video.
  const requestedDuration = audio.durationFrames ?? videoDurationFrames;
  const durationFrames = Math.max(
    1,
    Math.min(requestedDuration, videoDurationFrames),
  );
  const durationSec = (durationFrames / fps).toFixed(1);
  const videoDurationSec = (videoDurationFrames / fps).toFixed(1);

  const trimStart = audio.trimStartSec ?? 0;
  const fadeIn = audio.fadeInFrames ?? 15;
  const fadeOut = audio.fadeOutFrames ?? 30;

  const fadeInSec = (fadeIn / fps).toFixed(2);
  const fadeOutSec = (fadeOut / fps).toFixed(2);

  // Slider step = 1 frame so the duration scrubs at full timeline
  // precision. The readout still rounds to 0.1s for legibility, but the
  // underlying value matches what the renderer sees.
  const durationStep = 1;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-background/95 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <HugeiconsIcon
            icon={MusicNote01Icon}
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          />
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-foreground">
              {audio.title ?? "Background music"}
            </p>
            {audio.attribution && (
              <p className="truncate text-[10px] text-muted-foreground">
                {audio.attribution}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClear}
          aria-label="Remove background music"
          title="Remove background music"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="xs"
          onClick={onOpenLibrary}
          className="text-[11px]"
        >
          Browse library
        </Button>
      </div>

      {/* Volume */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor={ids.volume} className="text-[12px]">
            Volume
          </Label>
          <span className="font-mono text-[10px] text-muted-foreground">
            {dbLabel}
          </span>
        </div>
        <Slider
          id={ids.volume}
          min={0}
          max={1}
          step={0.01}
          value={[peak]}
          onValueChange={([v]) => onPatch({ volume: clamp01(v ?? 0) })}
        />
      </div>

      {/* Playback duration cap */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor={ids.duration} className="text-[12px]">
            Playback duration
          </Label>
          <span className="font-mono text-[10px] text-muted-foreground">
            {durationSec}s of {videoDurationSec}s
          </span>
        </div>
        <Slider
          id={ids.duration}
          min={1}
          max={Math.max(1, videoDurationFrames)}
          step={durationStep}
          value={[durationFrames]}
          onValueChange={([v]) => {
            if (v === undefined) return;
            const clamped = Math.max(
              1,
              Math.min(videoDurationFrames, Math.round(v)),
            );
            onPatch({ durationFrames: clamped });
          }}
        />
      </div>

      {/* Loop */}
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={ids.loop} className="text-[12px]">
          Loop if shorter than video
        </Label>
        <Switch
          id={ids.loop}
          size="sm"
          checked={audio.loop ?? false}
          onCheckedChange={(v) => onPatch({ loop: v })}
        />
      </div>

      {/* Trim start */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor={ids.trim} className="text-[12px]">
            Trim start
          </Label>
          <span className="font-mono text-[10px] text-muted-foreground">
            {trimStart.toFixed(2)}s
          </span>
        </div>
        {sourceDurationSec && sourceDurationSec > 0 ? (
          <Slider
            id={ids.trim}
            min={0}
            max={Math.max(0.1, sourceDurationSec)}
            step={0.1}
            value={[Math.min(trimStart, sourceDurationSec)]}
            onValueChange={([v]) =>
              onPatch({ trimStartSec: Math.max(0, v ?? 0) })
            }
          />
        ) : (
          <Input
            id={ids.trim}
            type="number"
            min={0}
            step={0.1}
            value={trimStart}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isFinite(v)) return;
              onPatch({ trimStartSec: Math.max(0, v) });
            }}
            className="h-8 text-xs"
          />
        )}
      </div>

      {/* Fade in */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor={ids.fadeIn} className="text-[12px]">
            Fade in
          </Label>
          <span className="font-mono text-[10px] text-muted-foreground">
            {fadeInSec}s
          </span>
        </div>
        <Slider
          id={ids.fadeIn}
          min={0}
          max={120}
          step={1}
          value={[fadeIn]}
          onValueChange={([v]) =>
            onPatch({ fadeInFrames: Math.max(0, Math.round(v ?? 0)) })
          }
        />
      </div>

      {/* Fade out */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor={ids.fadeOut} className="text-[12px]">
            Fade out
          </Label>
          <span className="font-mono text-[10px] text-muted-foreground">
            {fadeOutSec}s
          </span>
        </div>
        <Slider
          id={ids.fadeOut}
          min={0}
          max={240}
          step={1}
          value={[fadeOut]}
          onValueChange={([v]) =>
            onPatch({ fadeOutFrames: Math.max(0, Math.round(v ?? 0)) })
          }
        />
      </div>
    </div>
  );
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function formatDb(volume: number): string {
  if (volume <= 0) return "−∞ dB";
  const db = 20 * Math.log10(volume);
  if (db >= 0) return "0.0 dB";
  // The character before "dB" is U+2212 (minus) so it lines up visually
  // with the en-dash used elsewhere in the inspector.
  return `−${Math.abs(db).toFixed(1)} dB`;
}
