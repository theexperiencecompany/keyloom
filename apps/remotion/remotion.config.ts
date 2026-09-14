/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

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

Config.overrideWebpackConfig(enableTailwind);
