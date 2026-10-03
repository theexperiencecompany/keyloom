import { decodeBase64Url, isBlockedHost } from "@/lib/proxy-guard";

export const runtime = "edge";

/**
 * Same-origin image proxy. URL is encoded into the path segment (not a
 * query param) because Remotion's `<Img>` re-encodes the whole `src` value,
 * which double-encodes `?` / `&` and breaks query-style proxies. With the
 * URL as a base64url path segment, no characters need re-escaping.
 *
 * Usage: `/api/img/<base64url-encoded-url>`
 *
 * Hardening: the edge runtime can't pre-resolve DNS, so we can't fully
 * defeat DNS-rebinding SSRF. We do block literal private/loopback/link-local
 * IPs and the common internal hostnames, enforce an image content-type,
 * cap the response size, and time the upstream out. The proxy lives on
 * Vercel edge which has no direct line to private infra anyway.
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const FETCH_TIMEOUT_MS = 15_000;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ encoded: string }> },
) {
  const { encoded } = await params;
  const url = decodeBase64Url(encoded);
  if (!url) return new Response("Bad encoded url", { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return new Response("Unsupported protocol", { status: 400 });
  }
  if (isBlockedHost(parsed.hostname)) {
    return new Response("Blocked host", { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(parsed.toString(), {
      redirect: "follow",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
        accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch failed";
    return new Response(`Upstream fetch failed: ${msg}`, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(`Upstream ${upstream.status}`, {
      status: upstream.status || 502,
    });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return new Response("Not an image", { status: 415 });
  }
  const declaredLength = Number(upstream.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BYTES) {
    return new Response("Too large", { status: 413 });
  }

  // Cap response size even when the upstream omits Content-Length (chunked).
  let seenBytes = 0;
  const limiter = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      seenBytes += chunk.byteLength;
      if (seenBytes > MAX_BYTES) {
        controller.error(new Error("upstream exceeded size cap"));
        return;
      }
      controller.enqueue(chunk);
    },
  });

  return new Response(upstream.body.pipeThrough(limiter), {
    status: 200,
    headers: {
      "content-type": contentType,
      "access-control-allow-origin": "*",
      "cross-origin-resource-policy": "cross-origin",
      "cache-control": "public, max-age=86400, immutable",
    },
  });
}
