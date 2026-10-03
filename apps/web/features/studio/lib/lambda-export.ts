"use client";

import type { Project } from "@workspace/compositions/project";
import { downloadBlob } from "@/lib/download-blob";
import type { ExportOptions } from "./export-options";

export type LambdaExportResult = {
  url: string;
  filename: string;
};

export type LambdaExportArgs = {
  project: Project;
  options: ExportOptions;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
};

type StartResponse = {
  renderId: string;
  bucketName: string;
  functionName: string;
  filename?: string;
};

type ProgressResponse = {
  done: boolean;
  progress: number;
  outputUrl: string | null;
  filename: string | null;
};

function abortError(): DOMException {
  return new DOMException("Render cancelled", "AbortError");
}

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  if (!response.ok) {
    throw new Error(body?.error ?? `Request failed (${response.status})`);
  }

  return body as T;
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(abortError());
  }

  return new Promise((resolve, reject) => {
    const id = window.setTimeout(resolve, ms);
    const onAbort = () => {
      window.clearTimeout(id);
      reject(abortError());
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function cancelLambdaRender(render: StartResponse): Promise<void> {
  await fetch("/api/render/lambda/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(render),
  }).catch((err) => {
    console.warn("[lambda-export] failed to cancel render", err);
  });
}

/** Renders the Studio timeline (the "Project" composition) on Lambda. */
export async function renderProjectOnLambda({
  project,
  options,
  signal,
  onProgress,
}: LambdaExportArgs): Promise<LambdaExportResult> {
  const startResponse = await fetch("/api/render/lambda", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, options }),
    signal,
  });
  const render = await readJson<StartResponse>(startResponse);

  try {
    onProgress?.(0.01);

    for (;;) {
      if (signal?.aborted) {
        throw abortError();
      }

      const progressResponse = await fetch("/api/render/lambda/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(render),
        signal,
      });
      const progress = await readJson<ProgressResponse>(progressResponse);
      onProgress?.(Math.max(0.01, Math.min(0.99, progress.progress)));

      if (progress.done) {
        if (!progress.outputUrl) {
          throw new Error("Lambda render finished without an output URL.");
        }

        onProgress?.(1);
        return {
          url: progress.outputUrl,
          filename:
            progress.filename ??
            render.filename ??
            `keyloom-${render.renderId}.mp4`,
        };
      }

      await wait(1000, signal);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      await cancelLambdaRender(render);
    }
    throw err;
  }
}

export async function downloadRemoteUrl(
  url: string,
  filename: string,
): Promise<void> {
  // The finished MP4 lives at a cross-origin presigned S3 URL, so an
  // `<a download>` pointed straight at it is ignored (and pointing the anchor
  // at our `/api/download` proxy and navigating to it proved unreliable — in
  // several browsers the click just does nothing). Instead, fetch the file
  // through the same-origin proxy (no CORS issues; it streams S3 server-side)
  // and save the resulting blob with the proven object-URL mechanism.
  const proxied = `/api/download?url=${encodeURIComponent(
    url,
  )}&filename=${encodeURIComponent(filename)}`;
  try {
    const res = await fetch(proxied);
    if (!res.ok) {
      throw new Error(`Download proxy responded ${res.status}`);
    }
    downloadBlob(await res.blob(), filename);
  } catch (err) {
    console.error(
      "[lambda-export] proxied download failed; opening the file directly",
      err,
    );
    // Last resort: the presigned URL is reachable (it's what the preview
    // plays), so open it so the user can still save the video manually.
    window.open(url, "_blank", "noopener");
  }
}
