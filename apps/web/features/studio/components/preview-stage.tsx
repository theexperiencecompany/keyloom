"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { ProjectComposition } from "@workspace/compositions/compositions/Project/Project";
import type { Project } from "@workspace/compositions/project";
import type { Ref } from "react";
import { AgentLauncher } from "./agent-launcher";

type Props = {
  project: Project;
  playerInputProps: Project;
  totalDuration: number;
  hasClips: boolean;
  onOpenLibrary: () => void;
  /** Hands a brief to the agent (opens the agent panel + sends it). */
  onStartAgent: (text: string, mentions: string[]) => void;
  playerRef?: Ref<PlayerRef>;
};

export function PreviewStage({
  project,
  playerInputProps,
  totalDuration,
  hasClips,
  onOpenLibrary,
  onStartAgent,
  playerRef,
}: Props) {
  if (!hasClips) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-canvas">
        <AgentLauncher onSubmit={onStartAgent} onBrowse={onOpenLibrary} />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center bg-canvas p-8">
      <div
        className="relative max-h-full max-w-full overflow-hidden bg-black ring-1 ring-border"
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
