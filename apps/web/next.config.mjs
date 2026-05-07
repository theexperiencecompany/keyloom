import createMDX from "@next/mdx"
import remarkGfm from "remark-gfm"
import rehypeSlug from "rehype-slug"

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  transpilePackages: ["@workspace/ui", "@workspace/compositions"],
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
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
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
  },
})

export default withMDX(nextConfig)
