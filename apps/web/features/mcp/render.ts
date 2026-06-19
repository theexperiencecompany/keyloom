import {
  getRenderProgress,
  presignUrl,
  renderMediaOnLambda,
} from "@remotion/lambda/client";
import { compositionsById } from "@workspace/compositions/registry";
import { isAgentVisible } from "@/lib/agent/catalog";
import { getLambdaConfig } from "./config";
import type {
  RenderComponentOptions,
  RenderComponentResult,
  RenderStatus,
  StartRenderResult,
} from "./types";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_MS = 8 * 60 * 1000;

/**
 * Kicks off a Lambda render of one registered composition and returns
 * immediately with a handle (renderId + bucketName) to poll via
 * `getRenderStatus`. Reuses the SAME deployed S3 site + Lambda function the
 * studio exports use. Caller `props` are merged over the composition's defaults.
 */
export async function startRender(
  compositionId: string,
  props: Record<string, unknown>,
  options: RenderComponentOptions = {},
): Promise<StartRenderResult> {
  if (!isAgentVisible(compositionId)) {
    throw new Error(
      `Unknown component "${compositionId}". Call list_components to see valid ids.`,
    );
  }
  const info = compositionsById[compositionId];
  if (!info) throw new Error(`Unknown component "${compositionId}".`);

  const { region, serveUrl, functionName } = getLambdaConfig();

  const inputProps = {
    ...(info.defaultProps as Record<string, unknown>),
    ...props,
  };
  const fps = options.fps ?? info.fps;
  const durationInFrames = options.durationInFrames ?? info.durationInFrames;
  const scale = Math.min(2, Math.max(0.25, options.scale ?? 1));
  const bitrateKbps = options.videoBitrateKbps ?? 8000;

  const { renderId, bucketName } = await renderMediaOnLambda({
    region,
    functionName,
    serveUrl,
    composition: compositionId,
    inputProps,
    codec: "h264",
    imageFormat: "jpeg",
    x264Preset: "fast",
    forceFps: fps,
    forceDurationInFrames: durationInFrames,
    scale,
    videoBitrate: `${bitrateKbps}k`,
    privacy: "private",
    maxRetries: 2,
  });

  return {
    compositionId,
    renderId,
    bucketName,
    durationInFrames,
    fps,
    width: info.width,
    height: info.height,
  };
}

/**
 * Polls a render once. Returns progress; when `done`, includes a time-limited
 * presigned MP4 `url`. Stateless — safe to call from a serverless function.
 */
export async function getRenderStatus(
  renderId: string,
  bucketName: string,
): Promise<RenderStatus> {
  const { region, functionName } = getLambdaConfig();
  const progress = await getRenderProgress({
    region,
    functionName,
    bucketName,
    renderId,
  });

  if (progress.fatalErrorEncountered) {
    const first = progress.errors?.[0];
    throw new Error(first?.message ?? "Lambda render failed.");
  }

  if (!progress.done || !progress.outKey) {
    return { done: false, progress: progress.overallProgress };
  }

  const outBucket = progress.outBucket ?? bucketName;
  const url = await presignUrl({
    region,
    bucketName: outBucket,
    objectKey: progress.outKey,
    expiresInSeconds: 60 * 60 * 6,
    checkIfObjectExists: true,
  });
  if (!url) {
    throw new Error(
      "Render finished but its output file could not be located in S3.",
    );
  }
  return {
    done: true,
    progress: 1,
    url,
    filename: progress.outKey.split("/").pop() ?? `${renderId}.mp4`,
  };
}

/**
 * Blocking render — kicks off the render and waits for it to finish. Used by the
 * stdio MCP server (a long-lived local process where blocking is fine);
 * optionally downloads the MP4 to `outFile`. The hosted route uses
 * `startRender` + `getRenderStatus` instead so it never blocks a request.
 */
export async function renderComponent(
  compositionId: string,
  props: Record<string, unknown>,
  options: RenderComponentOptions = {},
): Promise<RenderComponentResult> {
  const started = await startRender(compositionId, props, options);

  const begun = Date.now();
  let status = await getRenderStatus(started.renderId, started.bucketName);
  while (!status.done) {
    if (Date.now() - begun > MAX_POLL_MS) {
      throw new Error("Lambda render timed out after 8 minutes.");
    }
    await sleep(POLL_INTERVAL_MS);
    status = await getRenderStatus(started.renderId, started.bucketName);
  }

  let outFile: string | undefined;
  if (options.outFile && status.url) {
    await downloadToFile(status.url, options.outFile);
    outFile = options.outFile;
  }

  return {
    compositionId,
    url: status.url ?? "",
    filename: status.filename ?? `${compositionId}.mp4`,
    outFile,
    durationInFrames: started.durationInFrames,
    fps: started.fps,
    width: started.width,
    height: started.height,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadToFile(url: string, path: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Could not download rendered video (HTTP ${res.status}).`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const { writeFile, mkdir } = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, buf);
}
