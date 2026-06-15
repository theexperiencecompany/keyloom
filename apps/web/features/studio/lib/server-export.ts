"use client";

/**
 * Server-side MP4 export — POSTs the Project to `/api/render`, which renders
 * it through `@remotion/renderer` (real headless Chromium). Unlike the
 * in-browser `@remotion/web-renderer` path (`local-export.ts`), this is
 * pixel-identical to the studio Player because it uses Chromium's real
 * compositor — so `backdrop-filter` glass, WebGL, and blend modes all survive.
 *
 * Trade-off: needs a Node server with Chromium (fine locally / self-hosted;
 * on serverless this moves to Remotion Lambda later). The endpoint returns the
 * whole MP4 at once, so there's no incremental progress yet.
 */

import type { Project } from "@workspace/compositions/project";

export type ServerExportResult = {
  blob: Blob;
  filename: string;
};

export async function renderProjectOnServer({
  project,
  signal,
}: {
  project: Project;
  signal?: AbortSignal;
}): Promise<ServerExportResult> {
  const res = await fetch("/api/render", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(project),
    signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || `Server render failed (${res.status})`);
  }

  const blob = await res.blob();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return { blob, filename: `keyloom-${stamp}.mp4` };
}
