"use client";

import { Player } from "@remotion/player";
import { ProjectComposition } from "@workspace/compositions/compositions/Project/Project";
import type { Project } from "@workspace/compositions/project";

/**
 * The live preview Player. Split into its own module so EditorView can
 * `next/dynamic` it: `ProjectComposition` statically imports the ENTIRE
 * composition tree (every Remotion component — WebGL, charts, etc.), which is
 * the heaviest thing to compile on the editor route. Lazy-loading it keeps the
 * editor shell (tabs, fields, header) fast to compile/navigate; the heavy
 * preview chunk streams in afterward.
 */
export function EditorPreview({
  project,
  totalDuration,
  width,
  height,
}: {
  project: Project;
  totalDuration: number;
  width: number;
  height: number;
}) {
  return (
    <Player
      component={ProjectComposition}
      inputProps={project}
      durationInFrames={totalDuration}
      fps={project.fps}
      compositionWidth={width}
      compositionHeight={height}
      style={{ width: "100%", height: "100%" }}
      controls
      loop
      autoPlay
      initiallyMuted
      numberOfSharedAudioTags={12}
      acknowledgeRemotionLicense
    />
  );
}
