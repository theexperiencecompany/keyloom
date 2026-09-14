import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getRemotionBundle } from "@/lib/remotion-bundle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Server-side MP4 render via `@remotion/renderer` — real headless Chromium.
 *
 * Unlike the in-browser `@remotion/web-renderer` export (which rasterizes the
 * DOM to a <canvas> and therefore drops compositor-only effects like
 * `backdrop-filter` / WebGL transmission), this captures each frame with
 * Chromium's actual screenshot pipeline — the SAME engine that paints the
 * studio Player. So the output is pixel-identical to the preview, glass and all.
 *
 * POST body: the studio `Project` JSON. Responds with the rendered `video/mp4`.
 */
export async function POST(req: Request): Promise<Response> {
  const started = Date.now();
  let project: unknown;
  try {
    project = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const inputProps = project as Record<string, unknown>;
  if (!inputProps || !Array.isArray(inputProps.clips)) {
    return new Response("Body must be a Project with a clips array", {
      status: 400,
    });
  }

  const outPath = path.join(os.tmpdir(), `render-${randomUUID()}.mp4`);

  try {
    const [{ selectComposition, renderMedia }, serveUrl] = await Promise.all([
      import("@remotion/renderer"),
      getRemotionBundle(),
    ]);

    // Resolve duration/dimensions from the Project's calculateMetadata (the
    // "Project" composition derives them from the clips), so the render length
    // matches the studio exactly.
    const composition = await selectComposition({
      serveUrl,
      id: "Project",
      inputProps,
    });

    await renderMedia({
      serveUrl,
      composition,
      codec: "h264",
      inputProps,
      outputLocation: outPath,
      // remotion.config.ts does NOT apply to the Node API, so replicate its
      // anti-shimmer settings explicitly. Without these the encoder re-quantises
      // the keyboard's fine grid + text differently every frame → the at-rest
      // "shake"/shimmer (visible only in the encoded video, never in the live
      // Player). PNG frame transport avoids a lossy JPEG step; CRF 12 + the
      // "slower" x264 preset cut the frame-to-frame variation ~7× (per the
      // config's own measurements).
      imageFormat: "png",
      crf: 12,
      x264Preset: "slower",
      // Use a real GPU-backed GL so backdrop-filter / any WebGL composites the
      // same way the Player does.
      chromiumOptions: { gl: "angle" },
      concurrency: null,
    });

    const data = await fs.readFile(outPath);
    console.info(
      "[api/render] done",
      data.byteLength,
      "bytes in",
      ((Date.now() - started) / 1000).toFixed(1),
      "s",
    );
    return new Response(new Uint8Array(data), {
      status: 200,
      headers: {
        "content-type": "video/mp4",
        "content-length": String(data.byteLength),
        "content-disposition": 'attachment; filename="render.mp4"',
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    console.error("[api/render] failed", err);
    return new Response(
      `Render failed: ${err instanceof Error ? err.message : String(err)}`,
      { status: 500 },
    );
  } finally {
    await fs.rm(outPath, { force: true }).catch(() => {});
  }
}
