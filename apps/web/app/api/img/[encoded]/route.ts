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

function decodeBase64Url(input: string): string | null {
  try {
    let s = input.replace(/-/g, "+").replace(/_/g, "/");
    const pad = s.length % 4;
    if (pad === 2) s += "==";
    else if (pad === 3) s += "=";
    else if (pad !== 0) return null;
    return atob(s);
  } catch {
    return null;
  }
}

function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().trim();
  if (!h) return true;
  if (h === "localhost") return true;
  if (
    h === "broadcasthost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal")
  ) {
    return true;
  }

  // IPv4 literal.
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    if ([a, b, Number(v4[3]), Number(v4[4])].some((n) => n > 255)) return true;
    if (a === 0) return true; // "this network"
    if (a === 10) return true; // RFC1918
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
    if (a === 192 && b === 168) return true; // RFC1918
    if (a === 192 && b === 0) return true; // IETF protocol assignments / test-net
    if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast & reserved
    return false;
  }

  // IPv6 literal (URL hostname strips the brackets).
  if (h.includes(":") && /^[0-9a-f:.]+$/.test(h)) {
    if (h === "::" || h === "::1") return true;
    if (h.startsWith("::ffff:")) {
      // IPv4-mapped IPv6 — re-check the inner v4.
      return isBlockedHost(h.slice("::ffff:".length));
    }
    if (
      h.startsWith("fe8") ||
      h.startsWith("fe9") ||
      h.startsWith("fea") ||
      h.startsWith("feb")
    ) {
      return true; // link-local fe80::/10
    }
    if (h.startsWith("fc") || h.startsWith("fd")) return true; // unique-local
    if (h.startsWith("ff")) return true; // multicast
    return false;
  }

  return false;
}

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
