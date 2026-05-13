"use client";

/**
 * Registers the same-origin image proxy service worker. Called once from
 * the Studio root mount. Idempotent — re-registers cheaply on every mount
 * but the browser dedupes the install.
 */
export async function registerImageProxy(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register("/sw-image-proxy.js", {
      scope: "/",
    });
    // Tell any waiting SW to take over immediately so the very first export
    // attempt after install routes through the proxy.
    if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
    await navigator.serviceWorker.ready;
  } catch (err) {
    console.warn("[image-proxy] register failed", err);
  }
}
