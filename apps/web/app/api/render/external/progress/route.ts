import {
  type AwsRegion,
  getRenderProgress,
  presignUrl,
} from "@remotion/lambda/client";
import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * API-key-authed progress poll for an external Lambda render started via
 * `../external`. Returns overall progress and, on completion, a presigned MP4
 * URL (6-hour expiry).
 */

function env(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function bearer(request: Request): string | null {
  const h = request.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1]!.trim() : null;
}

function filenameFromKey(key: string | null, fallback: string): string {
  if (!key) return fallback;
  return key.split("/").pop() || fallback;
}

function firstErrorMessage(errors: unknown): string {
  if (!Array.isArray(errors) || errors.length === 0) return "Lambda render failed.";
  const first = errors[0] as { message?: string; name?: string; stack?: string };
  return first.message ?? first.stack ?? first.name ?? "Lambda render failed.";
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

    const region = env("REMOTION_AWS_REGION");
    if (!region) throw new Error("REMOTION_AWS_REGION is not configured.");

    const body = (await request.json()) as {
      renderId?: unknown;
      bucketName?: unknown;
      functionName?: unknown;
      filename?: unknown;
    };

    if (
      typeof body.renderId !== "string" ||
      typeof body.bucketName !== "string" ||
      typeof body.functionName !== "string"
    ) {
      throw new Error("Missing Lambda render progress identifiers.");
    }

    const progress = await getRenderProgress({
      region: region as AwsRegion,
      functionName: body.functionName,
      bucketName: body.bucketName,
      renderId: body.renderId,
    });

    if (progress.fatalErrorEncountered) {
      return NextResponse.json(
        { error: firstErrorMessage(progress.errors) },
        { status: 500 },
      );
    }

    let outputUrl: string | null = null;
    const outBucket = progress.outBucket ?? body.bucketName;
    if (progress.done && progress.outKey) {
      outputUrl = await presignUrl({
        region: region as AwsRegion,
        bucketName: outBucket,
        objectKey: progress.outKey,
        expiresInSeconds: 60 * 60 * 6,
        checkIfObjectExists: true,
      });
    }

    return NextResponse.json({
      done: progress.done,
      progress: progress.overallProgress,
      outputUrl,
      filename: filenameFromKey(
        progress.outKey,
        typeof body.filename === "string"
          ? body.filename
          : `keyloom-${body.renderId}.mp4`,
      ),
    });
  } catch (err) {
    console.error("[external-render] progress failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
