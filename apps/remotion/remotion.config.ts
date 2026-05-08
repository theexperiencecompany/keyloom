/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import path from "node:path";
import { Config, type WebpackOverrideFn } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

// Remotion compiles this config to CJS so import.meta isn't available.
// Resolve relative to cwd which Remotion runs from apps/remotion.
const shims = path.resolve(process.cwd(), "src/shims");

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// Bridge config so @heygaia/chat-ui (extracted from a Next.js app) loads inside
// Remotion's webpack bundle.
//   1. Disable strict ESM resolution — chat-ui's bundle has imports like
//      `react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus` with no
//      .js extension; webpack 5 in strict mode rejects those.
//   2. Replace Next.js modules with local shims — chat-ui imports next/image,
//      next/dynamic, next/navigation, next/link, but we're not in a Next.js
//      app. The shims provide drop-in components/hooks that work in any React
//      tree (plain <img>, sync component renderer, no-op router, plain <a>).
const chatUiBridge: WebpackOverrideFn = (current) => ({
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
      "next/image$": path.join(shims, "next-image.tsx"),
      "next/dynamic$": path.join(shims, "next-dynamic.tsx"),
      "next/navigation$": path.join(shims, "next-navigation.tsx"),
      "next/link$": path.join(shims, "next-link.tsx"),
    },
  },
});

Config.overrideWebpackConfig((current) => chatUiBridge(enableTailwind(current)));
