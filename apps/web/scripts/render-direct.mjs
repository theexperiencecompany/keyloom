#!/usr/bin/env node
/**
 * Standalone Remotion server-render timing harness.
 *
 * Runs the same bundler+renderer pipeline that /api/render uses, so the
 * total time here is representative of what the user will see when calling
 * the route from the studio (minus the HTTP overhead, which is microseconds
 * vs minutes of render).
 */
import fs from "node:fs/promises";
import path from "node:path";

const projectPath =
  "/Users/aryan/Projects/GAIA/motion-studio/sample-projects/motion-studio-intro.json";
const remotionDir = "/Users/aryan/Projects/GAIA/motion-studio/apps/remotion";
const entryPoint = path.join(remotionDir, "src/index.ts");
const shimsDir = path.join(remotionDir, "src/shims");
const outPath = "/tmp/server-render.mp4";

const project = JSON.parse(await fs.readFile(projectPath, "utf8"));
for (const clip of project.clips) {
  if (typeof clip.durationInFrames !== "number" || clip.durationInFrames <= 0) {
    clip.durationInFrames = 90;
  }
}
const totalFrames = project.clips.reduce((s, c) => s + c.durationInFrames, 0);
console.log(
  `[time] project: ${project.width}x${project.height}@${project.fps}fps, ${project.clips.length} clips, ~${totalFrames} frames`,
);

const t0 = performance.now();

const { bundle } = await import("@remotion/bundler");
const { enableTailwind } = await import("@remotion/tailwind-v4");
const { selectComposition, renderMedia } = await import("@remotion/renderer");

const webpackOverride = (current) =>
  enableTailwind({
    ...current,
    module: {
      ...current.module,
      rules: [
        ...(current.module?.rules ?? []),
        { test: /\.m?js$/, resolve: { fullySpecified: false } },
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

const tBundle0 = performance.now();
const serveUrl = await bundle({
  entryPoint,
  webpackOverride,
  onProgress: (n) => {
    if (n % 25 === 0 || n === 100) console.log(`[time] bundle ${n}%`);
  },
});
const tBundle = performance.now() - tBundle0;
console.log(`[time] bundle done: ${(tBundle / 1000).toFixed(2)}s`);

const tSelect0 = performance.now();
const composition = await selectComposition({
  serveUrl,
  id: "Project",
  inputProps: project,
});
console.log(
  `[time] selectComposition: ${((performance.now() - tSelect0) / 1000).toFixed(2)}s`,
  `dim=${composition.width}x${composition.height} dur=${composition.durationInFrames}f`,
);

const tRender0 = performance.now();
let lastPct = -1;
await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  outputLocation: outPath,
  inputProps: project,
  onProgress: ({ progress, renderedFrames, encodedFrames }) => {
    const pct = Math.floor(progress * 100);
    if (pct >= lastPct + 10) {
      lastPct = pct;
      console.log(
        `[time] render ${pct}% rendered=${renderedFrames} encoded=${encodedFrames}`,
      );
    }
  },
});
const tRender = performance.now() - tRender0;
const stat = await fs.stat(outPath);
console.log(
  `[time] renderMedia: ${(tRender / 1000).toFixed(2)}s  output=${(stat.size / 1024 / 1024).toFixed(2)}MB`,
);

console.log(`[time] TOTAL: ${((performance.now() - t0) / 1000).toFixed(2)}s`);
