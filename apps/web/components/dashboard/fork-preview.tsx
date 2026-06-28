"use client";

import { Player } from "@remotion/player";
import { ProjectComposition } from "@workspace/compositions/compositions/Project/Project";
import { projectDuration } from "@workspace/compositions/project";
import * as React from "react";
import { forkToProject } from "@/lib/fork";
import type { UserComponent } from "@/lib/user-components";

/**
 * Live thumbnail for a forked component. Forks aren't registered modules (their
 * code is a string), so we render them the same way the studio does — through
 * ProjectComposition, which routes the fork to DynamicComposition and
 * transpiles it at runtime. Loaded via next/dynamic + mounted on hover so the
 * heavy composition graph stays off the My Projects initial load.
 */
export function ForkPreview({ fork }: { fork: UserComponent }) {
  const project = React.useMemo(() => forkToProject(fork), [fork]);
  const duration = React.useMemo(() => projectDuration(project), [project]);

  return (
    <Player
      component={ProjectComposition}
      inputProps={project}
      durationInFrames={duration}
      fps={project.fps}
      compositionWidth={project.width}
      compositionHeight={project.height}
      style={{ width: "100%", height: "100%" }}
      loop
      autoPlay
      initiallyMuted
      numberOfSharedAudioTags={0}
      acknowledgeRemotionLicense
    />
  );
}
