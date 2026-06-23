import {
  getRenderProgress,
  presignUrl,
  renderMediaOnLambda,
} from "@remotion/lambda/client";
import {
  type Clip,
  DEFAULT_PROJECT,
  type Project,
  projectDuration,
} from "@workspace/compositions/project";
import { compositionsById } from "@workspace/compositions/registry";
import { rewriteExternalImageUrls } from "@/features/studio/lib/proxy-external-images";
import { isAgentVisible } from "@/lib/agent/catalog";
import { resolveCompositionMeta } from "@/lib/composition-meta";
import { getLambdaConfig } from "./config";
import { buildDownloadUrl } from "./download-url";
import type {
  ProjectClipInput,
  RenderComponentOptions,
  RenderComponentResult,
  RenderProjectOptions,
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

/**
 * Builds the studio `Project` from a list of clip inputs: validates each
 * component, merges props over its defaults, and fills each clip's duration
 * from the component's resolved metadata when not given. Mirrors how the studio
 * stitches the "Project" composition.
 */
function buildProject(
  clips: ProjectClipInput[],
  options: RenderProjectOptions,
): Project {
  if (!Array.isArray(clips) || clips.length === 0) {
    throw new Error("Provide at least one clip in `clips`.");
  }
  const builtClips: Clip[] = clips.map((c, i) => {
    const compositionId = String(c.componentId ?? "");
    if (!isAgentVisible(compositionId)) {
      throw new Error(
        `Unknown component "${compositionId}" in clips[${i}]. Call list_components for valid ids.`,
      );
    }
    const info = compositionsById[compositionId];
    if (!info) throw new Error(`Unknown component "${compositionId}".`);
    const props = {
      ...(info.defaultProps as Record<string, unknown>),
      ...(c.props ?? {}),
    };
    const durationInFrames =
      typeof c.durationInFrames === "number" && c.durationInFrames > 0
        ? Math.round(c.durationInFrames)
        : resolveCompositionMeta(info, props).durationInFrames;
    return {
      id: `clip-${i}`,
      compositionId,
      props,
      durationInFrames,
      style: c.style as Clip["style"],
      transition: c.transition as Clip["transition"],
    };
  });

  return {
    fps: options.fps ?? DEFAULT_PROJECT.fps,
    width: options.width ?? DEFAULT_PROJECT.width,
    height: options.height ?? DEFAULT_PROJECT.height,
    clips: builtClips,
    defaultTransition: DEFAULT_PROJECT.defaultTransition,
  };
}

/**
 * Kicks off a Lambda render of a multi-clip PROJECT (the studio timeline) — the
 * "Project" composition stitches the clips together with transitions, exactly
 * like the studio export. Returns a handle to poll via `getRenderStatus`.
 */
export async function startProjectRender(
  clips: ProjectClipInput[],
  options: RenderProjectOptions = {},
): Promise<StartRenderResult> {
  const project = buildProject(clips, options);
  const { region, serveUrl, functionName } = getLambdaConfig();

  // Same image-proxy parity as single-component renders (CDNs that block
  // Lambda IPs render blank otherwise).
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL)
    ?.trim()
    .replace(/\/$/, "");
  const inputProps = (appUrl
    ? rewriteExternalImageUrls(project, appUrl)
    : project) as unknown as Record<string, unknown>;

  const scale = Math.min(2, Math.max(0.25, options.scale ?? 1));
  const bitrateKbps = options.videoBitrateKbps ?? 8000;

  const { renderId, bucketName } = await renderMediaOnLambda({
    region,
    functionName,
    serveUrl,
    composition: "Project",
    inputProps,
    codec: "h264",
    imageFormat: "jpeg",
    x264Preset: "fast",
    forceFps: project.fps,
    // Total duration is derived from the clips by the Project composition's
    // calculateMetadata on Lambda — don't force it.
    scale,
    videoBitrate: `${bitrateKbps}k`,
    privacy: "private",
    maxRetries: 2,
  });

  return {
    compositionId: "Project",
    renderId,
    bucketName,
    durationInFrames: projectDuration(project),
    fps: project.fps,
    width: project.width,
    height: project.height,
  };
}

/**
 * Blocking multi-clip project render — kicks off and waits for completion,
 * optionally saving the MP4 to `outFile`. Used by the stdio MCP server.
 */
export async function renderProject(
  clips: ProjectClipInput[],
  options: RenderProjectOptions = {},
): Promise<RenderComponentResult> {
  const started = await startProjectRender(clips, options);

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
    compositionId: "Project",
    url: status.url ?? "",
    filename: status.filename ?? "project.mp4",
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
