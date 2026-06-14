import type { AwsRegion } from "@remotion/lambda/client";
import { renderMediaOnLambda } from "@remotion/lambda/client";
import type { Project } from "@workspace/compositions/project";
import { NextResponse } from "next/server";
import type { ExportOptions } from "@/features/studio/lib/export-options";
import { prepareProjectForExport } from "@/features/studio/lib/prepare-export-project";
import { rewriteExternalImageUrls } from "@/features/studio/lib/proxy-external-images";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function env(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function intEnv(name: string, fallback: number): number {
  const raw = env(name);
  if (!raw) return fallback;

  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}

function lambdaConfig() {
  const region = env("REMOTION_AWS_REGION");
  const serveUrl = env("REMOTION_LAMBDA_SERVE_URL");

  if (!region || !serveUrl) {
    throw new Error(
      "Lambda rendering is not configured. Set REMOTION_AWS_REGION and REMOTION_LAMBDA_SERVE_URL in apps/web/.env.local.",
    );
  }

  const functionName = process.env.REMOTION_LAMBDA_FUNCTION_NAME;
  if (!functionName) {
    throw new Error("REMOTION_LAMBDA_FUNCTION_NAME is not set");
  }

  return {
    region: region as AwsRegion,
    serveUrl,
    functionName,
    concurrency: intEnv("REMOTION_LAMBDA_CONCURRENCY", 2),
    concurrencyPerLambda: intEnv("REMOTION_LAMBDA_CONCURRENCY_PER_LAMBDA", 1),
    framesPerLambda: intEnv("REMOTION_LAMBDA_FRAMES_PER_LAMBDA", 20),
    maxRetries: intEnv("REMOTION_LAMBDA_MAX_RETRIES", 3),
  };
}

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

function findBlobUrl(value: unknown, path = "project"): string | null {
  if (typeof value === "string") {
    return value.startsWith("blob:") ? path : null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const found = findBlobUrl(value[i], `${path}[${i}]`);
      if (found) return found;
    }
    return null;
  }

  for (const [key, nested] of Object.entries(value)) {
    const found = findBlobUrl(nested, `${path}.${key}`);
    if (found) return found;
  }

  return null;
}

function filenameForNow(): string {
  return `motion-studio-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19)}.mp4`;
}

function errorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (
    /AWS Concurrency limit reached|Rate Exceeded|TooManyRequestsException|Rate exceeded/i.test(
      message,
    )
  ) {
    return "AWS Lambda throttled this render because too many workers were active. Wait a minute and retry, or lower REMOTION_LAMBDA_CONCURRENCY in apps/web/.env.local.";
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

/**
 * Absolute origin for the image proxy. Prefer an explicit deploy URL (so the
 * proxy points at the public app even when called internally); otherwise derive
 * it from the incoming request.
 */
function proxyBaseUrl(request: Request): string {
  const configured = env("NEXT_PUBLIC_APP_URL") ?? env("APP_URL");
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
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
      concurrency,
      concurrencyPerLambda,
      framesPerLambda,
      maxRetries,
    } = lambdaConfig();
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
      concurrency,
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
