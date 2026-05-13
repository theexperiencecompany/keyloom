import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { getRemotionBundle } from "@/lib/remotion-bundle";
import { registerRender, tempPathFor } from "@/lib/render-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

/**
 * Server-side Remotion render. Streams NDJSON progress events to the client
 * and finishes with a `done` event carrying the id of the resulting MP4,
 * which the client then downloads via `/api/render/result/[id]`.
 *
 * Body: { project: Project, options?: { bitrate?, crf?, scale? } }
 *
 * Response: text/plain NDJSON, one event per line:
 *   {"type":"start"}
 *   {"type":"progress","value":0.42}
 *   {"type":"done","id":"<uuid>","filename":"...","size":12345}
 *   {"type":"error","message":"..."}
 *
 * Hard-locked to one in-flight render per process for now — Remotion spawns
 * a Chrome worker pool that's expensive to multiply.
 */

let renderInFlight = false;

export async function POST(req: NextRequest) {
  if (renderInFlight) {
    return new Response(
      JSON.stringify({
        type: "error",
        message:
          "Another render is already in progress on the server. Try again in a moment.",
      }),
      { status: 429, headers: { "content-type": "application/json" } },
    );
  }
  renderInFlight = true;

  const body = (await req.json()) as {
    project: unknown;
    options?: {
      bitrate?: number;
      crf?: number;
      scale?: number;
    };
  };
  const project = body.project as {
    width: number;
    height: number;
    fps: number;
  };
  const options = body.options ?? {};

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      };

      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      try {
        send({ type: "start" });

        const serveUrl = await getRemotionBundle();
        send({ type: "log", message: "Bundle ready, selecting composition" });

        const { selectComposition, renderMedia } = await import(
          "@remotion/renderer"
        );

        const composition = await selectComposition({
          serveUrl,
          id: "Project",
          inputProps: project as Record<string, unknown>,
        });

        const id = crypto.randomUUID();
        const outPath = tempPathFor(id);

        let lastProgress = 0;
        await renderMedia({
          composition,
          serveUrl,
          codec: "h264",
          outputLocation: outPath,
          inputProps: project as Record<string, unknown>,
          videoBitrate: options.bitrate
            ? `${Math.round(options.bitrate)}`
            : undefined,
          crf: options.crf,
          scale: options.scale,
          onProgress: ({ progress }) => {
            // Throttle to ~1% increments to avoid spamming the stream.
            if (progress - lastProgress >= 0.01 || progress >= 1) {
              lastProgress = progress;
              send({ type: "progress", value: progress });
            }
          },
        });

        const filename = `motion-studio-${new Date()
          .toISOString()
          .replace(/[:.]/g, "-")
          .slice(0, 19)}.mp4`;

        const fs = await import("node:fs/promises");
        const stat = await fs.stat(outPath);

        registerRender(id, outPath, filename);
        send({ type: "done", id, filename, size: stat.size });
      } catch (err) {
        console.error("[api/render] failed", err);
        send({
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        renderInFlight = false;
        close();
      }
    },
    cancel() {
      // Client disconnected — Remotion has no abort API exposed here so the
      // worker pool will finish on its own. Just release the in-flight flag
      // when it does (the start() finally already handles that).
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
