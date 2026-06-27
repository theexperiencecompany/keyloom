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
const IMG_PROXY_PREFIX = "/api/img/";
const AUDIO_PROXY_PREFIX = "/api/audio/proxy/";

function base64Url(input: string): string {
  // btoa needs binary-string input. encodeURIComponent + unescape is the
  // classic round-trip for arbitrary unicode -> latin1-safe bytes.
  const bytes =
    typeof btoa === "function"
      ? btoa(unescape(encodeURIComponent(input)))
      : Buffer.from(input, "utf-8").toString("base64");
  return bytes.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Wraps an arbitrary URL with a same-origin proxy prefix when the URL is
 * a cross-origin http/https resource. Local, data:, and blob: URLs pass
 * through unchanged so user-uploaded audio (blob:) and bundled static
 * assets (`/...`) keep working.
 */
function proxyExternal(src: string | undefined | null, prefix: string): string {
  if (!src) return src ?? "";
  if (
    src.startsWith("/") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  ) {
    return src;
  }
  if (src.startsWith(prefix)) return src;

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
  return `${prefix}${base64Url(parsed.toString())}`;
}

export function proxyExternalImg(src: string | undefined | null): string {
  // During a CLI / Lambda render the page is served from Remotion's static
  // bundle (on Lambda, an S3 site). A same-origin "/api/img/<base64>" proxy
  // path would resolve against that bundle origin and 404
  // (…s3….amazonaws.com/api/img/…). The render endpoints already rewrite
  // external images to an absolute "/api/proxy-image?url=…" URL the headless
  // Chromium can fetch directly, so pass through untouched here — same guard
  // `proxyExternalAudio` uses.
  if (isInsideRemotionBundle()) return src ?? "";
  return proxyExternal(src, IMG_PROXY_PREFIX);
}

/**
 * Same idea as `proxyExternalImg` but routes through the audio proxy
 * (`/api/audio/proxy/<base64url>`), which streams the upstream with an
 * `audio/*` content-type and `Access-Control-Allow-Origin: *`. Required
 * so the browser MP4 exporter (canvas + WebCodecs) can decode the audio
 * without CORS issues, and so the canvas never becomes tainted.
 *
 * Render-context aware: during a CLI / headless render the page is
 * served by remotion's own static bundler — the studio's `/api/*` routes
 * are NOT reachable. We detect that case by sniffing remotion's bundle
 * globals (`window.remotion_setFrame` only exists inside a remotion
 * render bundle) and pass the URL through untouched. Pixabay's CDN
 * serves MP3 with broad CORS, so the headless Chromium fetches it fine.
 */
type RemotionWindow = Window & {
  remotion_setFrame?: unknown;
  remotion_renderType?: string;
};

function isInsideRemotionBundle(): boolean {
  if (typeof window === "undefined") return true;
  const w = window as RemotionWindow;
  return (
    typeof w.remotion_setFrame !== "undefined" ||
    typeof w.remotion_renderType !== "undefined"
  );
}

export function proxyExternalAudio(src: string | undefined | null): string {
  if (isInsideRemotionBundle()) return src ?? "";
  return proxyExternal(src, AUDIO_PROXY_PREFIX);
}
