import type { Project } from "@workspace/compositions/project";
import type { ExportOptions } from "./export-options";

export function prepareProjectForExport(
  project: Project,
  options: ExportOptions,
): Project {
  const exportFps = options.fps;
  const fpsScale = exportFps / project.fps;

  if (fpsScale === 1) {
    return project;
  }

  return {
    ...project,
    fps: exportFps,
    clips: project.clips.map((clip) => ({
      ...clip,
      durationInFrames: Math.max(
        1,
        Math.round(clip.durationInFrames * fpsScale),
      ),
      transition: clip.transition
        ? {
            ...clip.transition,
            durationInFrames: Math.max(
              0,
              Math.round(clip.transition.durationInFrames * fpsScale),
            ),
          }
        : clip.transition,
    })),
    defaultTransition: project.defaultTransition
      ? {
          ...project.defaultTransition,
          durationInFrames: Math.max(
            0,
            Math.round(project.defaultTransition.durationInFrames * fpsScale),
          ),
        }
      : project.defaultTransition,
  };
}
