/**
 * Same-origin image proxy service worker. Intercepts every image fetch
 * whose origin is not this site and rewrites it to /api/img/<base64url>,
 * which we control and which returns the bytes with
 * `Access-Control-Allow-Origin: *`. That stops the browser from tainting
 * the canvas during a @remotion/web-renderer export.
 *
 * Registered on the studio route only — `register-image-proxy.ts`.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function toBase64Url(input) {
  const ascii = btoa(unescape(encodeURIComponent(input)));
  return ascii.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin === self.location.origin) return;
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // Only intercept image-ish things — destination tells us when the request
  // came from <img>/CSS background. For `fetch()` it's "" (empty), so we
  // also sniff a known-image-host allowlist + extension. Better to over-proxy
  // here than to miss an avatar; the proxy is cheap.
  const isImage =
    req.destination === "image" ||
    /\.(png|jpe?g|gif|webp|avif|svg|bmp|ico)(\?|$)/i.test(
      url.pathname + url.search,
    ) ||
    /(githubusercontent|githubassets|github\.com|pbs\.twimg|twimg|imgur|cloudinary|s3\.amazonaws|cloudfront\.net|googleusercontent|gravatar)/i.test(
      url.hostname,
    );
  if (!isImage) return;

  const proxied = `${self.location.origin}/api/img/${toBase64Url(req.url)}`;
  event.respondWith(
    fetch(proxied).catch(() => fetch(req)), // fall back to network on proxy failure
  );
});
