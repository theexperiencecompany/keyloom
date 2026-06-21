"use client";

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
      <div className="relative flex min-h-0 flex-1 items-center justify-center bg-[#eeeeee] dark:bg-[#161618]">
        <EmptyStage onOpenLibrary={onOpenLibrary} />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center bg-[#eeeeee] p-10 dark:bg-[#161618]">
      <div
        className="relative max-h-full max-w-full overflow-hidden rounded-md bg-black shadow-[0_4px_16px_-10px_rgba(0,0,0,0.5)] ring-1 ring-black/10 dark:ring-white/10"
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
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted/50">
          <svg
            viewBox="0 0 24 24"
            className="size-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <title>Play</title>
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-[13px] font-medium text-foreground/80">
            No clips yet
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Add a scene from the library to get started.
          </p>
        </div>
        <Button size="sm" onClick={onOpenLibrary} className="mt-1">
          Add scene
        </Button>
      </div>
    </div>
  );
}
