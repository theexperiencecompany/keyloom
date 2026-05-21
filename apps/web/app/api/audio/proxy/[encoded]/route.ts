export const runtime = "edge";

/**
 * Same-origin audio proxy. URL is encoded into the path segment (not a
 * query param) for the same reason as the image proxy: client-side helpers
 * may re-encode the whole `src` value, double-encoding `?` / `&`. With the
 * URL as a base64url path segment, no characters need re-escaping.
 *
 * Usage: `/api/audio/proxy/<base64url-encoded-url>`
 *
 * Hardening (same posture as `/api/img`): block literal private/loopback/
 * link-local IPs and common internal hostnames, enforce an audio
 * content-type, cap the response size, and time the upstream out.
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB — audio files run larger than images.
const FETCH_TIMEOUT_MS = 20_000;

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
    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 192 && b === 0) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }

  // IPv6 literal.
  if (h.includes(":") && /^[0-9a-f:.]+$/.test(h)) {
    if (h === "::" || h === "::1") return true;
    if (h.startsWith("::ffff:")) {
      return isBlockedHost(h.slice("::ffff:".length));
    }
    if (
      h.startsWith("fe8") ||
      h.startsWith("fe9") ||
      h.startsWith("fea") ||
      h.startsWith("feb")
    ) {
      return true;
    }
    if (h.startsWith("fc") || h.startsWith("fd")) return true;
    if (h.startsWith("ff")) return true;
    return false;
  }

  return false;
}

export async function GET(
  req: Request,
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

  // Forward the client's Range header so the upstream can return 206 and
  // @remotion/media's WebCodecs decoder can stream the file instead of
  // pulling the whole thing into memory. Without this, the decoder waits
  // for the entire MP3 to download before any audio plays — which is what
  // breaks "click play and hear something now" in the studio preview.
  const rangeHeader = req.headers.get("range") ?? undefined;
  const upstreamHeaders: Record<string, string> = {
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    accept: "audio/mpeg,audio/mp3,audio/*,*/*",
  };
  if (rangeHeader) upstreamHeaders.range = rangeHeader;

  let upstream: Response;
  try {
    upstream = await fetch(parsed.toString(), {
      redirect: "follow",
      headers: upstreamHeaders,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch failed";
    return new Response(`Upstream fetch failed: ${msg}`, { status: 502 });
  }

  // 200 OK or 206 Partial Content are both acceptable; anything else is
  // upstream telling us no.
  if ((upstream.status !== 200 && upstream.status !== 206) || !upstream.body) {
    return new Response(`Upstream ${upstream.status}`, {
      status: upstream.status || 502,
    });
  }

  const upstreamCT = upstream.headers.get("content-type") ?? "";
  const looksLikeAudio =
    upstreamCT.startsWith("audio/") ||
    upstreamCT === "application/octet-stream" ||
    upstreamCT === "binary/octet-stream";
  if (!looksLikeAudio) {
    return new Response("Not an audio resource", { status: 415 });
  }
  const declaredLength = Number(upstream.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BYTES) {
    return new Response("Too large", { status: 413 });
  }

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

  const outCT = upstreamCT.startsWith("audio/") ? upstreamCT : "audio/mpeg";

  const responseHeaders: Record<string, string> = {
    "content-type": outCT,
    "access-control-allow-origin": "*",
    "access-control-expose-headers":
      "content-length,content-range,accept-ranges",
    "cross-origin-resource-policy": "cross-origin",
    "cache-control": "public, max-age=86400, immutable",
    // Advertise byte-range support so @remotion/media's decoder picks the
    // streaming path even when the upstream stripped it.
    "accept-ranges": "bytes",
  };
  // Pass through length / range metadata when the upstream provided it so
  // the decoder knows the total size + seeks correctly.
  const upstreamCR = upstream.headers.get("content-range");
  if (upstreamCR) responseHeaders["content-range"] = upstreamCR;
  const upstreamCL = upstream.headers.get("content-length");
  if (upstreamCL) responseHeaders["content-length"] = upstreamCL;

  return new Response(upstream.body.pipeThrough(limiter), {
    status: upstream.status,
    headers: responseHeaders,
  });
}

/**
 * Some clients probe with HEAD before issuing a ranged GET. Without this
 * the probe gets the App-Router default 405, which a few decoders treat
 * as "ranges unsupported" and then refuse to stream.
 */
export async function HEAD(
  req: Request,
  ctx: { params: Promise<{ encoded: string }> },
) {
  const res = await GET(req, ctx);
  return new Response(null, { status: res.status, headers: res.headers });
}
