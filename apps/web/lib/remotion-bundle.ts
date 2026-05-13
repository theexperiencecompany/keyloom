import path from "node:path";
import type { WebpackOverrideFn } from "@remotion/bundler";

/**
 * Bundles the Remotion entry (`apps/remotion/src/index.ts`) once per server
 * process and caches the resulting serveUrl. Subsequent renders reuse the
 * same bundle — bundling is the slowest part of a cold render so this
 * matters a lot.
 *
 * The webpack override mirrors `apps/remotion/remotion.config.ts` — without
 * it, the bundle fails because `@heygaia/chat-ui` (consumed transitively by
 * `@workspace/compositions`) imports Next-only modules + has un-extensioned
 * ESM specifiers webpack 5 rejects in strict mode. We alias those Next
 * imports to local shims that live in `apps/remotion/src/shims`.
 */

let cached: Promise<string> | null = null;

export function getRemotionBundle(): Promise<string> {
  if (cached) return cached;
  cached = (async () => {
    const { bundle } = await import("@remotion/bundler");
    const { enableTailwind } = await import("@remotion/tailwind-v4");

    const remotionDir = path.resolve(process.cwd(), "../remotion");
    const entryPoint = path.join(remotionDir, "src/index.ts");
    const shimsDir = path.join(remotionDir, "src/shims");

    const webpackOverride: WebpackOverrideFn = (current) =>
      enableTailwind({
        ...current,
        module: {
          ...current.module,
          rules: [
            ...(current.module?.rules ?? []),
            {
              test: /\.m?js$/,
              resolve: { fullySpecified: false },
            },
          ],
        },
        resolve: {
          ...current.resolve,
          alias: {
            ...current.resolve?.alias,
            "next/image$": path.join(shimsDir, "next-image.tsx"),
            "next/dynamic$": path.join(shimsDir, "next-dynamic.tsx"),
            "next/navigation$": path.join(shimsDir, "next-navigation.tsx"),
            "next/link$": path.join(shimsDir, "next-link.tsx"),
          },
        },
      });

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
