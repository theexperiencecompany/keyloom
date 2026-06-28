/**
 * Lists meme template clips straight from the R2 bucket so the editor's template
 * list stays in sync with whatever's uploaded — no code change per new template.
 *
 * Uses the S3-compatible API (ListObjectsV2). Configure with R2 S3 credentials
 * (NOT the Cloudflare API token / `cfat_…` — that's a different auth type):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, optional R2_BUCKET.
 *
 * Returns object keys; the client builds the playable URL via memeAsset() so it
 * goes through the same-origin proxy. Falls back to an empty list (the editor
 * then uses its static registry) when credentials aren't set.
 */
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VIDEO_EXT = /\.(webm|mp4|mov|m4v)$/i;

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

function titleFromKey(key: string): string {
  const file = key.split("/").pop() ?? key;
  const base = file.replace(VIDEO_EXT, "");
  const words = base.replace(/[_-]+/g, " ").trim();
  return words.replace(/\b\w/g, (c) => c.toUpperCase()) || base || "Template";
}

export async function GET() {
  const accountId = env("R2_ACCOUNT_ID");
  const accessKeyId = env("R2_ACCESS_KEY_ID");
  const secretAccessKey = env("R2_SECRET_ACCESS_KEY");
  const bucket = env("R2_BUCKET") ?? "keyloom";
  const prefix = env("R2_MEME_PREFIX") ?? "memes/";

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return NextResponse.json({
      templates: [],
      configured: false,
    });
  }

  try {
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    const templates: { id: string; title: string; key: string }[] = [];
    let ContinuationToken: string | undefined;
    do {
      const out = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken,
        }),
      );
      for (const obj of out.Contents ?? []) {
        const key = obj.Key;
        if (!key || key.endsWith("/") || !VIDEO_EXT.test(key)) continue;
        const id = (key.split("/").pop() ?? key).replace(VIDEO_EXT, "");
        templates.push({ id, title: titleFromKey(key), key });
      }
      ContinuationToken = out.IsTruncated
        ? out.NextContinuationToken
        : undefined;
    } while (ContinuationToken);

    templates.sort((a, b) => a.title.localeCompare(b.title));
    return NextResponse.json({ templates, configured: true });
  } catch (err) {
    console.error("Failed to list meme templates from R2:", err);
    return NextResponse.json(
      { templates: [], configured: true, error: "Failed to list bucket" },
      { status: 200 },
    );
  }
}
