/**
 * Hosts a user-uploaded audio file so a cloud (Lambda) render can reach it.
 *
 * Browser uploads become `blob:` URLs that only exist in the user's tab —
 * the in-browser export can read them, but Lambda's headless Chromium can't,
 * so `/api/render/lambda` rejects any project whose audio src is a blob. This
 * endpoint pushes the file into the same S3 bucket Lambda already renders
 * from and returns a presigned URL the render can fetch.
 */
import {
  type AwsRegion,
  getAwsClient,
  getOrCreateBucket,
  presignUrl,
} from "@remotion/lambda";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Keep this in sync with the upload panel's client-side limit.
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
// SigV4 presigned URLs cap at 7 days; long enough to outlive a render session.
const PRESIGN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

function env(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function safeName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "audio";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "audio.mp3";
}

export async function POST(request: Request) {
  try {
    const region = env("REMOTION_AWS_REGION");
    if (!region) {
      throw new Error(
        "Cloud audio hosting is not configured. Set REMOTION_AWS_REGION in apps/web/.env.local.",
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new Error("No audio file provided.");
    }
    if (file.size === 0) {
      throw new Error("Audio file is empty.");
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(
        `Audio file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 25 MB.`,
      );
    }

    const { bucketName } = await getOrCreateBucket({
      region: region as AwsRegion,
    });

    const objectKey = `keyloom-uploads/audio/${crypto.randomUUID()}-${safeName(
      file.name,
    )}`;
    const body = new Uint8Array(await file.arrayBuffer());

    const { client, sdk } = getAwsClient({
      region: region as AwsRegion,
      service: "s3",
    });
    await client.send(
      new sdk.PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: body,
        ContentType: file.type || "audio/mpeg",
      }),
    );

    const url = await presignUrl({
      region: region as AwsRegion,
      bucketName,
      objectKey,
      expiresInSeconds: PRESIGN_EXPIRY_SECONDS,
    });

    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[audio-upload] failed", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
