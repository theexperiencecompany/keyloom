import { renderMediaOnLambda } from "@remotion/lambda/client";
import type { Project } from "@workspace/compositions/project";
import { NextResponse } from "next/server";
import type { ExportOptions } from "@/features/studio/lib/export-options";
import { prepareProjectForExport } from "@/features/studio/lib/prepare-export-project";
import { rewriteExternalImageUrls } from "@/features/studio/lib/proxy-external-images";
import {
  filenameForNow,
  findBlobUrl,
  lambdaConfig,
  proxyBaseUrl,
} from "@/lib/lambda-render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertProject(value: unknown): asserts value is Project {
  if (!value || typeof value !== "object") {
    throw new Error("Missing project JSON.");
  }

  const project = value as Partial<Project>;
  if (
    typeof project.fps !== "number" ||
    typeof project.width !== "number" ||
    typeof project.height !== "number" ||
    !Array.isArray(project.clips)
  ) {
    throw new Error("Invalid project JSON.");
  }
}

function assertOptions(value: unknown): asserts value is ExportOptions {
  if (!value || typeof value !== "object") {
    throw new Error("Missing export options.");
  }

  const options = value as Partial<ExportOptions>;
  if (
    typeof options.bitrate !== "number" ||
    typeof options.scale !== "number" ||
    typeof options.fps !== "number"
  ) {
    throw new Error("Invalid export options.");
  }
}

function errorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (
    /AWS Concurrency limit reached|Rate Exceeded|TooManyRequestsException|Rate exceeded/i.test(
      message,
    )
  ) {
    return "AWS Lambda throttled this render because too many workers were active. Wait a minute and retry, or raise REMOTION_LAMBDA_FRAMES_PER_LAMBDA in apps/web/.env.local (fewer, larger chunks = fewer concurrent workers).";
  }
  return message;
}

/**
 * Resolves the Lambda render target from the request body. Two shapes are
 * accepted:
 *   - `{ project, options }` — the Studio timeline, rendered via the
 *     "Project" composition with fps-rescaled clips.
 *   - `{ composition, inputProps, options }` — a single registered
 *     composition (the per-component editor), rendered by id.
 */
function resolveRender(
  body: {
    project?: unknown;
    composition?: unknown;
    inputProps?: unknown;
    forceDurationInFrames?: unknown;
    options?: unknown;
  },
  /**
   * Absolute origin used to rewrite external image URLs through our
   * `/api/proxy-image` endpoint (GitHub/Google CDNs block Lambda IPs). Must be
   * absolute — Lambda's headless Chromium resolves relative URLs against the S3
   * serve URL, not our app.
   */
  baseUrl: string,
): {
  composition: string;
  inputProps: Record<string, unknown>;
  options: ExportOptions;
  /**
   * Overrides the composition's metadata duration. The editor sends this so a
   * single composition rendered at a non-native fps keeps its wall-clock
   * length (the Studio path achieves the same by pre-scaling clip durations).
   */
  forceDurationInFrames?: number;
} {
  assertOptions(body.options);

  if (typeof body.composition === "string") {
    const inputProps = (body.inputProps ?? {}) as Record<string, unknown>;
    const blobPath = findBlobUrl(inputProps, "inputProps");
    if (blobPath) {
      throw new Error(
        `Cloud rendering cannot access browser-only blob URLs (${blobPath}). Upload that media to a reachable URL first.`,
      );
    }
    const forceDurationInFrames =
      typeof body.forceDurationInFrames === "number" &&
      body.forceDurationInFrames > 0
        ? Math.round(body.forceDurationInFrames)
        : undefined;
    return {
      composition: body.composition,
      inputProps: rewriteExternalImageUrls(inputProps, baseUrl),
      options: body.options,
      forceDurationInFrames,
    };
  }

  assertProject(body.project);
  // Uploaded audio reaches us as a browser-only `blob:` src plus a hosted
  // `uploadUrl` (see /api/audio/upload). Swap to the reachable URL before the
  // blob guard so cloud renders can fetch the file.
  const audio = body.project.audio;
  if (audio?.src.startsWith("blob:") && audio.uploadUrl) {
    audio.src = audio.uploadUrl;
  }
  const blobPath = findBlobUrl(body.project);
  if (blobPath) {
    throw new Error(
      `Cloud rendering cannot access browser-only blob URLs (${blobPath}). Upload that media to a reachable URL first.`,
    );
  }
  return {
    composition: "Project",
    inputProps: rewriteExternalImageUrls(
      prepareProjectForExport(body.project, body.options),
      baseUrl,
    ) as unknown as Record<string, unknown>,
    options: body.options,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      project?: unknown;
      composition?: unknown;
      inputProps?: unknown;
      forceDurationInFrames?: unknown;
      options?: unknown;
    };

    const { composition, inputProps, options, forceDurationInFrames } =
      resolveRender(body, proxyBaseUrl(request));

    const {
      region,
      serveUrl,
      functionName,
      concurrencyPerLambda,
      framesPerLambda: minFramesPerLambda,
      maxRetries,
    } = lambdaConfig();

    // Remotion hard-caps a render at 200 Lambda functions (frameCount /
    // framesPerLambda). A small fixed framesPerLambda (e.g. 20) blows past that
    // on longer videos — 4290 frames / 20 = 215 → "Too many functions". Scale
    // the chunk size up with the frame count so we stay under the cap (with
    // margin), while never dropping below the configured floor for short clips.
    const MAX_LAMBDA_FUNCTIONS = 190;
    const framesPerLambda =
      typeof forceDurationInFrames === "number" && forceDurationInFrames > 0
        ? Math.max(
            minFramesPerLambda,
            Math.ceil(forceDurationInFrames / MAX_LAMBDA_FUNCTIONS),
          )
        : minFramesPerLambda;

    const filename = filenameForNow();

    const result = await renderMediaOnLambda({
      region,
      functionName,
      serveUrl,
      composition,
      inputProps,
      codec: "h264",
      imageFormat: "jpeg",
      x264Preset: "fast",
      videoBitrate: `${Math.round(options.bitrate / 1000)}k`,
      scale: Math.min(2, Math.max(0.25, options.scale)),
      forceFps: options.fps,
      forceDurationInFrames,
      concurrencyPerLambda,
      framesPerLambda,
      maxRetries,
      privacy: "private",
      outName: filename,
      metadata: {
        filename,
      },
    });

    return NextResponse.json({
      renderId: result.renderId,
      bucketName: result.bucketName,
      functionName,
      filename,
    });
  } catch (err) {
    console.error("[lambda-render] start failed", err);
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
