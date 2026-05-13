import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import { getRemotionBundle } from "@/lib/remotion-bundle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Returns a zip of the pre-built Remotion bundle. The "Download fast
 * renderer" flow in the studio fetches this once, then assembles a final
 * user-facing zip on the client side (with their project.json + a tiny
 * render.mjs + a README + this bundle/). Cached server-side via the
 * module-level promise in `lib/remotion-bundle.ts`.
 */

let zipCache: Promise<{ data: ArrayBuffer; etag: string }> | null = null;

async function buildZip(): Promise<{ data: ArrayBuffer; etag: string }> {
  const serveUrl = await getRemotionBundle();
  const zip = new JSZip();
  await walkInto(zip, serveUrl, "bundle");
  const data = await zip.generateAsync({
    type: "arraybuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  // Cheap content-hash etag using the bundle path + size as a proxy. The
  // bundle path changes every time `bundle()` runs (it's a tempdir), so
  // this is effectively a per-server-restart token — good enough for the
  // download cache.
  const etag = `"${serveUrl.split("/").pop()}-${data.byteLength}"`;
  return { data, etag };
}

async function walkInto(
  zip: JSZip,
  absoluteDir: string,
  zipPrefix: string,
): Promise<void> {
  const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
  for (const e of entries) {
    const childAbs = path.join(absoluteDir, e.name);
    const childZip = `${zipPrefix}/${e.name}`;
    if (e.isDirectory()) {
      await walkInto(zip, childAbs, childZip);
    } else if (e.isFile()) {
      const buf = await fs.readFile(childAbs);
      zip.file(childZip, buf);
    }
  }
}

export async function GET(req: Request) {
  if (!zipCache) zipCache = buildZip();
  let payload: { data: ArrayBuffer; etag: string };
  try {
    payload = await zipCache;
  } catch (err) {
    zipCache = null;
    return new Response(
      `Bundle failed: ${err instanceof Error ? err.message : String(err)}`,
      { status: 500 },
    );
  }

  const ifNoneMatch = req.headers.get("if-none-match");
  if (ifNoneMatch === payload.etag) {
    return new Response(null, { status: 304, headers: { etag: payload.etag } });
  }

  return new Response(payload.data, {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-length": String(payload.data.byteLength),
      "content-disposition": 'attachment; filename="bundle.zip"',
      etag: payload.etag,
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
