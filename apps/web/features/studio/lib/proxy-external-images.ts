/**
 * Rewrites external image URLs to route through our same-origin
 * `/api/proxy-image` endpoint before a project/inputProps payload is handed to
 * the Lambda renderer.
 *
 * GitHub and several other CDNs block AWS Lambda IP ranges, so images served
 * directly from them render blank on Lambda. Proxying the fetch through our
 * Next.js server (an allowed IP) fixes that.
 *
 * Only *external image* URLs are rewritten:
 *   - absolute `http(s)` URLs (relative `/foo.png` and `staticFile()` paths are
 *     served from the Lambda bundle itself, so they're left alone),
 *   - that are NOT already S3 URLs (the render output bucket / uploaded media),
 *   - that are NOT already pointing at `/api/proxy-image`,
 *   - and that look like images — either a known image CDN host or an image
 *     file extension.
 */

const IMAGE_CDN_HOSTS = [
  "githubusercontent.com",
  "googleusercontent.com",
  "github.com",
];

const IMAGE_EXTENSION = /\.(png|jpe?g|gif|webp|avif|svg|bmp|ico)(\?|#|$)/i;

function isS3Host(host: string): boolean {
  return host.endsWith("amazonaws.com") || host.includes(".s3.");
}

function matchesCdnHost(host: string): boolean {
  return IMAGE_CDN_HOSTS.some(
    (cdn) => host === cdn || host.endsWith(`.${cdn}`),
  );
}

/** True for an absolute, non-S3 external image URL worth proxying. */
export function isExternalImageUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false;
  if (value.includes("/api/proxy-image")) return false;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  const host = url.hostname.toLowerCase();
  if (isS3Host(host)) return false;

  return matchesCdnHost(host) || IMAGE_EXTENSION.test(url.pathname);
}

/**
 * @param baseUrl Absolute origin to prefix the proxy path with (e.g.
 *   `https://app.example.com`). Lambda's headless Chromium resolves relative
 *   URLs against the S3 serve URL, so a base is required for proxied images to
 *   resolve. Pass `""` only when the consumer is same-origin in a browser.
 */
function toProxyUrl(original: string, baseUrl: string): string {
  return `${baseUrl}/api/proxy-image?url=${encodeURIComponent(original)}`;
}

/**
 * True for a RELATIVE image path that needs an origin to resolve — e.g.
 * `components/prank/image1.png` or `/images/foo.jpg`. These break on Lambda
 * because Remotion resolves them against the deployed S3 render *site* bundle,
 * not the app that authored them. Absolute (`http(s)://`), protocol-relative
 * (`//host/…`), `data:` and `blob:` URLs are NOT relative paths.
 */
export function isRelativeImagePath(value: string): boolean {
  if (!value) return false;
  if (/^(https?:)?\/\//i.test(value)) return false; // absolute or protocol-relative
  if (/^(data|blob):/i.test(value)) return false;
  return IMAGE_EXTENSION.test(value);
}

/**
 * Deep-clones `value`, resolving every RELATIVE image path against `baseUrl`
 * (an absolute origin like `https://app.example.com`) so it becomes an absolute
 * URL the Lambda renderer can fetch. Absolute/data/blob URLs are left untouched.
 *
 * Used by the external render endpoint: callers (e.g. HaloAI) may send image
 * srcs relative to THEIR origin; without this they'd 404 against the render
 * site bundle. Safe because our own compositions never store relative image
 * paths in props — they're always empty or absolute — so nothing bundled is
 * affected.
 */
export function resolveRelativeImageUrls<T>(value: T, baseUrl: string): T {
  const base = baseUrl.replace(/\/$/, "");
  const walk = <V>(v: V): V => {
    if (typeof v === "string") {
      if (!isRelativeImagePath(v)) return v;
      const path = v.startsWith("/") ? v : `/${v}`;
      return `${base}${path}` as unknown as V;
    }
    if (Array.isArray(v)) return v.map(walk) as unknown as V;
    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      for (const [key, nested] of Object.entries(v)) out[key] = walk(nested);
      return out as V;
    }
    return v;
  };
  return walk(value);
}

/**
 * Deep-clones `value`, replacing every external image URL string with its
 * proxied form. Non-string leaves and structure are preserved.
 */
export function rewriteExternalImageUrls<T>(value: T, baseUrl: string): T {
  if (typeof value === "string") {
    return (isExternalImageUrl(value)
      ? toProxyUrl(value, baseUrl)
      : value) as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      rewriteExternalImageUrls(item, baseUrl),
    ) as unknown as T;
  }

  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = rewriteExternalImageUrls(nested, baseUrl);
    }
    return out as T;
  }

  return value;
}
