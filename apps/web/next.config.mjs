import createMDX from "@next/mdx"

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  transpilePackages: ["@workspace/ui", "@workspace/compositions"],
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
    "@remotion/tailwind-v4",
    "@tailwindcss/webpack",
    "@tailwindcss/node",
    "@tailwindcss/oxide",
    "lightningcss",
    "@remotion/compositor-linux-x64-gnu",
    "@remotion/compositor-linux-x64-musl",
    "@remotion/compositor-linux-arm64-gnu",
    "@remotion/compositor-linux-arm64-musl",
    "@remotion/compositor-darwin-x64",
    "@remotion/compositor-darwin-arm64",
    "@remotion/compositor-win32-x64-msvc",
    "esbuild",
  ],
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [["remark-gfm", {}]],
    rehypePlugins: [["rehype-slug", {}]],
  },
})

export default withMDX(nextConfig)
