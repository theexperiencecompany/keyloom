import {
  getRenderProgress,
  presignUrl,
  renderMediaOnLambda,
} from "@remotion/lambda/client";
import { compositionsById } from "@workspace/compositions/registry";
import { rewriteExternalImageUrls } from "@/features/studio/lib/proxy-external-images";
import { isAgentVisible } from "@/lib/agent/catalog";
import { getComponent } from "@/lib/components";
import { getLambdaConfig } from "./config";
import { buildDownloadUrl } from "./download-url";
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

  const merged = {
    ...(info.defaultProps as Record<string, unknown>),
    ...props,
  };
  // Parity with the studio Lambda route: external image URLs (avatars, photo
  // bubbles, wallpapers, gallery photos) from CDNs that block Lambda IPs render
  // blank unless proxied through our app. We can only proxy when a public app
  // origin is configured — Lambda must be able to reach it. Without one, URLs
  // pass through unchanged (fine for already-reachable hosts and bundled
  // "images/..." assets).
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL)
    ?.trim()
    .replace(/\/$/, "");
  const inputProps = appUrl
    ? (rewriteExternalImageUrls(merged, appUrl) as Record<string, unknown>)
    : merged;
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
 * Render a user's forked component. The fork's editable source isn't in the
 * deployed bundle, so we render the registered "Project" composition and embed
 * the fork in `customComponents` — exactly how the studio renders forks, so it
 * goes through the runtime transpile path (DynamicComposition). Returns null if
 * `forkId` isn't one of this user's forks (caller falls back to a built-in).
 */
export async function startForkRender(
  userId: string,
  forkId: string,
  props: Record<string, unknown>,
  options: RenderComponentOptions = {},
): Promise<StartRenderResult | null> {
  const fork = await getComponent(userId, forkId);
  if (!fork) return null;

  const { region, serveUrl, functionName } = getLambdaConfig();
  const info = compositionsById[fork.baseId];
  const fps = options.fps ?? info?.fps ?? 60;
  const durationInFrames =
    options.durationInFrames ?? info?.durationInFrames ?? 150;
  const width = info?.width ?? 1920;
  const height = info?.height ?? 1080;
  const scale = Math.min(2, Math.max(0.25, options.scale ?? 1));
  const bitrateKbps = options.videoBitrateKbps ?? 8000;

  const merged = {
    ...((info?.defaultProps as Record<string, unknown>) ?? {}),
    ...props,
  };
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL)
    ?.trim()
    .replace(/\/$/, "");
  const clipProps = appUrl
    ? (rewriteExternalImageUrls(merged, appUrl) as Record<string, unknown>)
    : merged;

  const project = {
    fps,
    width,
    height,
    clips: [
      { id: forkId, compositionId: forkId, props: clipProps, durationInFrames },
    ],
    customComponents: {
      [forkId]: {
        baseId: fork.baseId,
        name: fork.name,
        code: fork.code,
        ...(fork.exportName ? { exportName: fork.exportName } : {}),
      },
    },
  };

  const { renderId, bucketName } = await renderMediaOnLambda({
    region,
    functionName,
    serveUrl,
    composition: "Project",
    inputProps: project,
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
    compositionId: forkId,
    renderId,
    bucketName,
    durationInFrames,
    fps,
    width,
    height,
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
    downloadUrl: buildDownloadUrl(renderId, outBucket),
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
