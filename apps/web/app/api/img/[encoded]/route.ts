export const runtime = "edge";

/**
 * Same-origin image proxy. URL is encoded into the path segment (not a
 * query param) because Remotion's `<Img>` re-encodes the whole `src` value,
 * which double-encodes `?` / `&` and breaks query-style proxies. With the
 * URL as a base64url path segment, no characters need re-escaping.
 *
 * Usage: `/api/img/<base64url-encoded-url>`
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

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

  const upstream = await fetch(parsed.toString(), {
    redirect: "follow",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*",
    },
  });

  if (!upstream.ok) {
    return new Response(`Upstream ${upstream.status}`, {
      status: upstream.status,
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "image/png",
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=86400, immutable",
    },
  });
}
