"use client";

/**
 * Client-side single-frame PNG capture powered by Remotion's first-party
 * `@remotion/web-renderer` `renderStillOnWeb`. Renders the exact frame the
 * Player is paused on into an OffscreenCanvas at the project's native
 * dimensions, then encodes a PNG Blob. Matches the same composition config
 * the MP4 export uses (`ProjectComposition` + `calculateMetadata` + the
 * Project object as `inputProps`), so what you see in the paused preview
 * is what lands in the downloaded PNG.
 */

import type { PlayerRef } from "@remotion/player";
import { renderStillOnWeb } from "@remotion/web-renderer";
import { ProjectComposition } from "@workspace/compositions/compositions/Project/Project";
import { type Project, projectDuration } from "@workspace/compositions/project";
import type { RefObject } from "react";

export async function captureCurrentFrame(
  playerRef: RefObject<PlayerRef | null>,
  project: Project,
): Promise<Blob> {
  const player = playerRef.current;
  if (!player) {
    throw new Error("Player not ready yet — try again in a moment.");
  }

  const total = projectDuration(project);
  const rawFrame = Math.round(player.getCurrentFrame());
  // Clamp into the valid composition frame range so a playhead sitting on
  // the very last frame still renders something — Remotion's render range
  // is [0, durationInFrames - 1].
  const frame = Math.max(0, Math.min(total - 1, rawFrame));

  const result = await renderStillOnWeb({
    composition: {
      id: "Project",
      component: ProjectComposition as React.ComponentType<
        Record<string, unknown>
      >,
      calculateMetadata: ({ props }) => {
        const p = props as Project;
        return {
          durationInFrames: projectDuration(p),
          fps: p.fps,
          width: p.width,
          height: p.height,
        };
      },
    },
    inputProps: project as unknown as Record<string, unknown>,
    frame,
  });

  return await result.blob({ format: "png" });
}

export function downloadPngBlob(
  blob: Blob,
  filename = "keyloom-frame.png",
): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Filename helper — ISO timestamp with colons/dots replaced. */
export function screenshotFilename(now: Date = new Date()): string {
  const iso = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `keyloom-frame-${iso}.png`;
}
