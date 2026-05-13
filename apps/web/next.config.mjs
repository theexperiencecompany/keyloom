import createMDX from "@next/mdx"

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  transpilePackages: ["@workspace/ui", "@workspace/compositions"],
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/tailwind-v4",
    "@tailwindcss/webpack",
    "@tailwindcss/node",
    "@tailwindcss/oxide",
    "lightningcss",
    "esbuild",
  ],
  // The /api/render-bundle route lazily writes a webpack bundle to
  // ../remotion/build/ at request time. Without these excludes, Next.js
  // traces references into that directory during build and Vercel tries
  // to lstat hashed font/asset files that don't exist yet (build-time
  // ENOENT). Excluding the runtime-generated build dir from the trace
  // keeps the deploy succeeding.
  outputFileTracingExcludes: {
    "*": [
      "../remotion/build/**",
      "../../apps/remotion/build/**",
    ],
  },
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [["remark-gfm", {}]],
    rehypePlugins: [["rehype-slug", {}]],
  },
})

export default withMDX(nextConfig)
