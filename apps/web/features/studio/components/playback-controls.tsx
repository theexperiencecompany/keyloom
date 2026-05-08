"use client";

import {
  BackwardIcon,
  ForwardIcon,
  PauseIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";

type Props = {
  currentFrame: number;
  totalDuration: number;
  fps: number;
  isPlaying: boolean;
  disabled: boolean;
  onPlayPause: () => void;
  onSkipToStart: () => void;
  onSkipToEnd: () => void;
};

export function PlaybackControls({
  currentFrame,
  totalDuration,
  fps,
  isPlaying,
  disabled,
  onPlayPause,
  onSkipToStart,
  onSkipToEnd,
}: Props) {
  const currentSeconds = currentFrame / fps;
  const totalSeconds = totalDuration / fps;

  return (
    <div className="flex shrink-0 items-center justify-center gap-3 bg-background px-4 py-2">
      <div className="flex items-center gap-1">
        <ControlButton
          onClick={onSkipToStart}
          disabled={disabled}
          title="Skip to start"
          icon={BackwardIcon}
        />
        <ControlButton
          onClick={onPlayPause}
          disabled={disabled}
          title={isPlaying ? "Pause" : "Play"}
          icon={isPlaying ? PauseIcon : PlayIcon}
        />
        <ControlButton
          onClick={onSkipToEnd}
          disabled={disabled}
          title="Skip to end"
          icon={ForwardIcon}
        />
      </div>

      <p className="text-[11px] tabular-nums text-muted-foreground">
        <span className="text-foreground">{formatClock(currentSeconds)}</span>
        <span className="mx-1 opacity-50">/</span>
        <span>{formatClock(totalSeconds)}</span>
      </p>
    </div>
  );
}

function ControlButton({
  onClick,
  disabled,
  title,
  icon,
}: {
  onClick: () => void;
  disabled: boolean;
  title: string;
  icon: typeof PlayIcon;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      <HugeiconsIcon icon={icon} size={16} strokeWidth={2} />
    </Button>
  );
}

function formatClock(s: number): string {
  const safe = Math.max(0, s);
  const mm = Math.floor(safe / 60);
  const ss = Math.floor(safe % 60);
  const cs = Math.floor((safe - Math.floor(safe)) * 100);
  return `${mm}:${ss.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}
