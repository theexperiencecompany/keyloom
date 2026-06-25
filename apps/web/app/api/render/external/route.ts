import type { AwsRegion } from "@remotion/lambda/client";
import { renderMediaOnLambda } from "@remotion/lambda/client";
import { type Project, projectDuration } from "@workspace/compositions/project";
import { NextResponse } from "next/server";
import type { ExportOptions } from "@/features/studio/lib/export-options";
import { prepareProjectForExport } from "@/features/studio/lib/prepare-export-project";
import { rewriteExternalImageUrls } from "@/features/studio/lib/proxy-external-images";
import { consumeRender } from "@/lib/account";
import { authenticateApiKey } from "@/lib/api-keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * API-key-authed Lambda render for EXTERNAL apps (e.g. the standalone HaloAI
 * editor). Mirrors the studio's `/api/render/lambda` project path, but instead
 * of a WorkOS session it authenticates a `kl_live_…` bearer token and renders
 * the multi-clip "Project" composition. Pair with `./progress`.
 */

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
  const functionName = env("REMOTION_LAMBDA_FUNCTION_NAME");
  if (!region || !serveUrl || !functionName) {
    throw new Error(
      "Lambda rendering is not configured. Set REMOTION_AWS_REGION, REMOTION_LAMBDA_SERVE_URL and REMOTION_LAMBDA_FUNCTION_NAME.",
    );
  }
  return {
    region: region as AwsRegion,
    serveUrl,
    functionName,
    concurrencyPerLambda: intEnv("REMOTION_LAMBDA_CONCURRENCY_PER_LAMBDA", 1),
    framesPerLambda: intEnv("REMOTION_LAMBDA_FRAMES_PER_LAMBDA", 20),
    maxRetries: intEnv("REMOTION_LAMBDA_MAX_RETRIES", 3),
  };
}

function assertProject(value: unknown): asserts value is Project {
  const project = (value ?? {}) as Partial<Project>;
  if (
    !value ||
    typeof value !== "object" ||
    typeof project.fps !== "number" ||
    typeof project.width !== "number" ||
    typeof project.height !== "number" ||
    !Array.isArray(project.clips)
  ) {
    throw new Error("Invalid or missing project JSON.");
  }
}

function findBlobUrl(value: unknown, path = "project"): string | null {
  if (typeof value === "string") return value.startsWith("blob:") ? path : null;
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const f = findBlobUrl(value[i], `${path}[${i}]`);
      if (f) return f;
    }
    return null;
  }
  for (const [k, nested] of Object.entries(value)) {
    const f = findBlobUrl(nested, `${path}.${k}`);
    if (f) return f;
  }
  return null;
}

function filenameForNow(): string {
  return `keyloom-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.mp4`;
}

function bearer(request: Request): string | null {
  const h = request.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1]!.trim() : null;
}

function proxyBaseUrl(request: Request): string {
  const configured = env("NEXT_PUBLIC_APP_URL") ?? env("APP_URL");
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateApiKey(bearer(request));
    if (!auth) {
      return NextResponse.json(
        { error: "Invalid or missing API key." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      project?: unknown;
      options?: Partial<ExportOptions>;
    };

    assertProject(body.project);
    const project = body.project;

    const blobPath = findBlobUrl(project);
    if (blobPath) {
      return NextResponse.json(
        {
          error: `Cloud rendering cannot access browser-only blob URLs (${blobPath}). Upload that media to a reachable URL first.`,
        },
        { status: 400 },
      );
    }

    // Render accounting. Best-effort: if the account has an active subscription
    // we claim one render against quota; accounts without a subscription row are
    // allowed through so a valid key "just works" in development.
    const consume = await consumeRender(auth.user.id);
    if (
      !consume.ok &&
      consume.reason &&
      !/no subscription/i.test(consume.reason)
    ) {
      return NextResponse.json({ error: consume.reason }, { status: 402 });
    }

    const options: ExportOptions = {
      preset: "balanced",
      bitrate:
        typeof body.options?.bitrate === "number"
          ? body.options.bitrate
          : 8_000_000,
      scale: typeof body.options?.scale === "number" ? body.options.scale : 1,
      keyframeIntervalSec:
        typeof body.options?.keyframeIntervalSec === "number"
          ? body.options.keyframeIntervalSec
          : 1,
      fps: (typeof body.options?.fps === "number"
        ? body.options.fps
        : project.fps) as ExportOptions["fps"],
    };

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
    // on longer videos — 4290 frames / 20 = 215 → "Too many functions". Derive
    // the render's frame count from the project (scaled for forceFps) and grow
    // the chunk size so we stay under the cap, never below the configured floor.
    const MAX_LAMBDA_FUNCTIONS = 190;
    const baseFrames = projectDuration(project);
    const frameCount =
      options.fps && project.fps && options.fps !== project.fps
        ? Math.round(baseFrames * (options.fps / project.fps))
        : baseFrames;
    const framesPerLambda =
      frameCount > 0
        ? Math.max(
            minFramesPerLambda,
            Math.ceil(frameCount / MAX_LAMBDA_FUNCTIONS),
          )
        : minFramesPerLambda;

    const filename = filenameForNow();

    const inputProps = rewriteExternalImageUrls(
      prepareProjectForExport(project, options),
      proxyBaseUrl(request),
    ) as unknown as Record<string, unknown>;

    const result = await renderMediaOnLambda({
      region,
      functionName,
      serveUrl,
      composition: "Project",
      inputProps,
      codec: "h264",
      imageFormat: "jpeg",
      x264Preset: "fast",
      videoBitrate: `${Math.round(options.bitrate / 1000)}k`,
      scale: Math.min(2, Math.max(0.25, options.scale)),
      forceFps: options.fps,
      concurrencyPerLambda,
      framesPerLambda,
      maxRetries,
      privacy: "private",
      outName: filename,
      metadata: { filename },
    });

    return NextResponse.json({
      renderId: result.renderId,
      bucketName: result.bucketName,
      functionName,
      filename,
      rendersRemaining: consume.ok ? consume.remaining : null,
    });
  } catch (err) {
    console.error("[external-render] start failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
