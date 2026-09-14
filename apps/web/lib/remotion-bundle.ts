import path from "node:path";
import type { WebpackOverrideFn } from "@remotion/bundler";

/**
 * Server-side Remotion bundle, produced lazily on first request and
 * cached for the lifetime of the Node process.
 *
 * Used by `/api/render-bundle` to ship a pre-built bundle to users who
 * download the local CLI zip. Avoids forcing every user to run webpack
 * (10–30s cold) on their own machine.
 */

let cached: Promise<string> | null = null;

export function getRemotionBundle(): Promise<string> {
  if (cached) return cached;
  cached = (async () => {
    const { bundle } = await import("@remotion/bundler");
    const { enableTailwind } = await import("@remotion/tailwind-v4");

    const remotionDir = path.resolve(process.cwd(), "../remotion");
    const entryPoint = path.join(remotionDir, "src/index.ts");

    const webpackOverride: WebpackOverrideFn = (current) =>
      enableTailwind(current);

    const serveUrl = await bundle({
      entryPoint,
      webpackOverride,
      onProgress: (n) => {
        if (n % 25 === 0 || n === 100) {
          console.info(`[remotion-bundle] ${n}%`);
        }
      },
    });
    console.info("[remotion-bundle] ready", serveUrl);
    return serveUrl;
  })();

  cached.catch((err) => {
    console.error("[remotion-bundle] failed", err);
    cached = null;
  });

  return cached;
}
