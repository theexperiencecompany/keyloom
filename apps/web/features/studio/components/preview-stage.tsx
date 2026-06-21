"use client";

import { PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Player, type PlayerRef } from "@remotion/player";
import { ProjectComposition } from "@workspace/compositions/compositions/Project/Project";
import type { Project } from "@workspace/compositions/project";
import { Button } from "@workspace/ui/components/button";
import type { Ref } from "react";

type Props = {
  project: Project;
  playerInputProps: Project;
  totalDuration: number;
  hasClips: boolean;
  onOpenLibrary: () => void;
  playerRef?: Ref<PlayerRef>;
};

export function PreviewStage({
  project,
  playerInputProps,
  totalDuration,
  hasClips,
  onOpenLibrary,
  playerRef,
}: Props) {
  if (!hasClips) {
    return (
      <div className="studio-canvas flex min-h-0 flex-1 items-center justify-center">
        <div className="relative z-10">
          <EmptyStage onOpenLibrary={onOpenLibrary} />
        </div>
      </div>
    );
  }

  return (
    <div className="studio-canvas flex min-h-0 flex-1 items-center justify-center p-10">
      <div
        className="relative z-10 max-h-full max-w-full overflow-hidden rounded-lg bg-black shadow-[0_28px_70px_-24px_rgba(0,0,0,0.7),0_10px_28px_-16px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
        style={{
          aspectRatio: `${project.width} / ${project.height}`,
          height: "100%",
          width: "auto",
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      >
        <Player
          ref={playerRef}
          component={ProjectComposition}
          inputProps={playerInputProps}
          durationInFrames={totalDuration}
          fps={project.fps}
          compositionWidth={project.width}
          compositionHeight={project.height}
          style={{ width: "100%", height: "100%" }}
          loop
          numberOfSharedAudioTags={12}
          acknowledgeRemotionLicense
        />
      </div>
    </div>
  );
}

function EmptyStage({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] ring-1 ring-white/10 shadow-lg shadow-black/30">
        <HugeiconsIcon
          icon={PlayIcon}
          className="size-6 text-foreground/70"
          strokeWidth={1.8}
        />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">No clips yet</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Add a scene from the library to get started.
        </p>
      </div>
      <Button size="sm" onClick={onOpenLibrary} className="mt-1">
        Add scene
      </Button>
    </div>
  );
}
