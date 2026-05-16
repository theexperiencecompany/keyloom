/**
 * Route external image URLs through the studio's `/api/img/<encoded>`
 * proxy so they load with `Access-Control-Allow-Origin: *`. Required for
 * any `<Img>` that sets `crossOrigin="anonymous"` (which the in-browser
 * MP4 exporter needs to keep its canvas untainted).
 *
 * The URL is base64url-encoded into the path segment — not a query param —
 * because Remotion's `<Img>` re-encodes the whole `src` value, which
 * double-encodes `?` / `&` and would break a query-style proxy.
 *
 * Pass-through cases (no proxy applied):
 *  - empty / nullish
 *  - absolute paths (`/...`) and `data:` / `blob:` URIs
 *  - same-origin absolute URLs
 *  - URLs that already point at this proxy
 *
 * SSR-safe: deterministic between server and client renders, so it never
 * triggers a hydration mismatch.
 */
const PROXY_PREFIX = "/api/img/";

function base64Url(input: string): string {
  // btoa needs binary-string input. encodeURIComponent + unescape is the
  // classic round-trip for arbitrary unicode -> latin1-safe bytes.
  const bytes =
    typeof btoa === "function"
      ? btoa(unescape(encodeURIComponent(input)))
      : Buffer.from(input, "utf-8").toString("base64");
  return bytes.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function proxyExternalImg(src: string | undefined | null): string {
  if (!src) return src ?? "";
  if (
    src.startsWith("/") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  ) {
    return src;
  }
  if (src.startsWith(PROXY_PREFIX)) return src;

  let parsed: URL;
  try {
    parsed =
      typeof window !== "undefined"
        ? new URL(src, window.location.origin)
        : new URL(src);
  } catch {
    return src;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return src;
  }
  if (
    typeof window !== "undefined" &&
    parsed.origin === window.location.origin
  ) {
    return src;
  }
  return `${PROXY_PREFIX}${base64Url(parsed.toString())}`;
}
