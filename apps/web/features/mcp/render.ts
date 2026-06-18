import {
  getRenderProgress,
  presignUrl,
  renderMediaOnLambda,
} from "@remotion/lambda/client";
import { compositionsById } from "@workspace/compositions/registry";
import { isAgentVisible } from "@/lib/agent/catalog";
import { getLambdaConfig } from "./config";
import type { RenderComponentOptions, RenderComponentResult } from "./types";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_MS = 8 * 60 * 1000;

/**
 * Renders a single registered composition to an MP4 on Lambda and waits for it
 * to finish. Reuses the SAME deployed S3 site + Lambda function the studio
 * exports use — no separate render infra. The caller's `props` are merged over
 * the composition's defaults, so partial fills still render (missing fields
 * fall back to the natural look).
 *
 * Returns a time-limited presigned URL to the MP4; when `outFile` is given, the
 * file is also downloaded to that path.
 */
export async function renderComponent(
  compositionId: string,
  props: Record<string, unknown>,
  options: RenderComponentOptions = {},
): Promise<RenderComponentResult> {
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

  const { outKey, outBucket } = await waitForRender(
    region,
    functionName,
    bucketName,
    renderId,
  );

  const url = await presignUrl({
    region,
    bucketName: outBucket,
    objectKey: outKey,
    expiresInSeconds: 60 * 60 * 6,
    checkIfObjectExists: true,
  });
  const filename = outKey.split("/").pop() ?? `${compositionId}.mp4`;

  let outFile: string | undefined;
  if (options.outFile) {
    await downloadToFile(url, options.outFile);
    outFile = options.outFile;
  }

  return {
    compositionId,
    url,
    filename,
    outFile,
    durationInFrames,
    fps,
    width: info.width,
    height: info.height,
  };
}

async function waitForRender(
  region: ReturnType<typeof getLambdaConfig>["region"],
  functionName: string,
  bucketName: string,
  renderId: string,
): Promise<{ outKey: string; outBucket: string }> {
  const started = Date.now();
  for (;;) {
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
    if (progress.done && progress.outKey) {
      return {
        outKey: progress.outKey,
        outBucket: progress.outBucket ?? bucketName,
      };
    }
    if (Date.now() - started > MAX_POLL_MS) {
      throw new Error("Lambda render timed out after 8 minutes.");
    }
    await sleep(POLL_INTERVAL_MS);
  }
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
