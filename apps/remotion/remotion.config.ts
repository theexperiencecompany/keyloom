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

// PNG (lossless) instead of JPEG for the Chromium→ffmpeg frame transport.
// JPEG re-quantises each frame slightly differently and the h264 encoder
// then has to compress that noise, producing visible glyph-edge shimmer in
// at-rest text. Lossless PNG eliminates the first lossy step. Trade-off:
// ~15% slower render, marginally larger intermediate files (deleted after
// encode).
Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
// CRF 12 + "slower" preset measurably eliminates ~7× of the at-rest
// frame-to-frame variation from h264 default (avg L1 242 → 36, mostly
// invisible). Same final file size, ~30% slower encode. The default Remotion
// "medium" preset with default CRF (23) is what produces the visible
// shimmer the user reported on text-heavy compositions.
Config.setCrf(12);
Config.setX264Preset("slower");

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

Config.overrideWebpackConfig((current) =>
  chatUiBridge(enableTailwind(current)),
);
