"use client";

import type { Project } from "@workspace/compositions/project";
import type { ExportOptions } from "./export-options";

export type ServerExportProgress = (progress: number) => void;

export type ServerExportResult = {
  blob: Blob;
  filename: string;
};

type DoneEvent = {
  type: "done";
  id: string;
  filename: string;
  size: number;
};

type ProgressEvent = { type: "progress"; value: number };
type ErrorEvent = { type: "error"; message: string };
type LogEvent = { type: "log"; message: string };
type StartEvent = { type: "start" };
type StreamEvent =
  | StartEvent
  | LogEvent
  | ProgressEvent
  | DoneEvent
  | ErrorEvent;

/**
 * Kicks off a server-side Remotion render and resolves with the downloaded
 * MP4 blob. Streams NDJSON progress events back to the caller via
 * `onProgress`. Cancellable via `signal` — aborting the fetch will close the
 * stream on the server side too.
 */
export async function renderProjectOnServer(opts: {
  project: Project;
  options: ExportOptions;
  onProgress?: ServerExportProgress;
  signal?: AbortSignal;
}): Promise<ServerExportResult> {
  const { project, options, onProgress, signal } = opts;

  const res = await fetch("/api/render", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      project,
      options: {
        bitrate: options.bitrate,
        scale: options.scale,
      },
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Server render failed (${res.status}): ${text || res.statusText}`,
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done: DoneEvent | null = null;

  while (true) {
    const { value, done: streamDone } = await reader.read();
    if (streamDone) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let event: StreamEvent;
      try {
        event = JSON.parse(trimmed) as StreamEvent;
      } catch {
        console.warn("[server-export] non-JSON line", trimmed);
        continue;
      }
      if (event.type === "progress") {
        onProgress?.(event.value);
      } else if (event.type === "log") {
        console.info("[server-export]", event.message);
      } else if (event.type === "error") {
        throw new Error(event.message);
      } else if (event.type === "done") {
        done = event;
      }
    }
  }

  if (!done) {
    throw new Error("Server render ended without a completion event.");
  }

  const dlRes = await fetch(`/api/render/result/${done.id}`, { signal });
  if (!dlRes.ok) {
    throw new Error(
      `Failed to download rendered MP4: ${dlRes.status} ${dlRes.statusText}`,
    );
  }
  const blob = await dlRes.blob();
  return { blob, filename: done.filename };
}
