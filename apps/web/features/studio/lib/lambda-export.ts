"use client";

import type { Project } from "@workspace/compositions/project";
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

export type LambdaCompositionExportArgs = {
  composition: string;
  inputProps: Record<string, unknown>;
  options: ExportOptions;
  /** Overrides metadata duration so a non-native fps keeps wall-clock length. */
  forceDurationInFrames?: number;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
};

type StartBody =
  | { project: Project; options: ExportOptions }
  | {
      composition: string;
      inputProps: Record<string, unknown>;
      options: ExportOptions;
      forceDurationInFrames?: number;
    };

async function runLambdaRender(
  body: StartBody,
  signal?: AbortSignal,
  onProgress?: (progress: number) => void,
): Promise<LambdaExportResult> {
  const startResponse = await fetch("/api/render/lambda", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
            `motion-studio-${render.renderId}.mp4`,
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

/** Renders the Studio timeline (the "Project" composition) on Lambda. */
export function renderProjectOnLambda({
  project,
  options,
  signal,
  onProgress,
}: LambdaExportArgs): Promise<LambdaExportResult> {
  return runLambdaRender({ project, options }, signal, onProgress);
}

/** Renders a single registered composition by id on Lambda (component editor). */
export function renderCompositionOnLambda({
  composition,
  inputProps,
  options,
  forceDurationInFrames,
  signal,
  onProgress,
}: LambdaCompositionExportArgs): Promise<LambdaExportResult> {
  return runLambdaRender(
    { composition, inputProps, options, forceDurationInFrames },
    signal,
    onProgress,
  );
}

export function downloadRemoteUrl(url: string, filename: string): void {
  // The presigned S3 URL is cross-origin, so the <a download> attribute is
  // ignored by browsers and the video would open in a new tab. Route through
  // our same-origin proxy, which sends Content-Disposition: attachment so the
  // browser saves the file instead.
  const anchor = document.createElement("a");
  anchor.href = `/api/download?url=${encodeURIComponent(
    url,
  )}&filename=${encodeURIComponent(filename)}`;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
