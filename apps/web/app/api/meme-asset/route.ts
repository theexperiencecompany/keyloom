/**
 * Same-origin proxy for meme assets hosted on Cloudflare R2.
 *
 * The /memes editor draws the template clip + background onto a <canvas> and
 * reads pixels back on export. Cross-origin assets taint the canvas unless the
 * host sends CORS headers — and the r2.dev managed URL doesn't reliably honor a
 * bucket CORS policy. Proxying through our own origin sidesteps CORS entirely:
 * the browser sees a same-origin response, so the canvas stays clean.
 *
 * Range requests are forwarded so the <video> can seek and the exporter can
 * play it through. The proxied host is allowlisted to avoid an open proxy/SSRF.
 *
 * For production you can skip this hop: serve the bucket from a custom domain
 * with a CORS policy and set NEXT_PUBLIC_MEME_DIRECT=1 (see lib/memes.ts).
 */
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const FORWARD_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "etag",
  "last-modified",
] as const;

function allowedHost(host: string): boolean {
  // Any R2 public/dev or S3-API host.
  if (host.endsWith(".r2.dev") || host.endsWith(".r2.cloudflarestorage.com")) {
    return true;
  }
  // Plus whatever NEXT_PUBLIC_MEME_CDN points at (e.g. a custom domain).
  const cdn = process.env.NEXT_PUBLIC_MEME_CDN;
  if (cdn) {
    try {
      return new URL(cdn).host === host;
    } catch {
      // ignore malformed env
    }
  }
  return false;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("u");
  if (!raw) return new Response("Missing 'u'", { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("Bad URL", { status: 400 });
  }
  if (target.protocol !== "https:" || !allowedHost(target.host)) {
    return new Response("Forbidden host", { status: 403 });
  }

  const range = req.headers.get("range");
  const upstream = await fetch(target.toString(), {
    headers: range ? { Range: range } : {},
    // R2 public objects are cacheable; let the platform cache them.
    cache: "no-store",
  });

  if (!upstream.ok && upstream.status !== 206) {
    return new Response(`Upstream ${upstream.status}`, {
      status: upstream.status,
    });
  }

  const headers = new Headers();
  for (const h of FORWARD_HEADERS) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (!headers.has("accept-ranges")) headers.set("accept-ranges", "bytes");
  headers.set("cache-control", "public, max-age=3600");

  return new Response(upstream.body, { status: upstream.status, headers });
}
