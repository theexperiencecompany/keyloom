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
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [["remark-gfm", {}]],
    rehypePlugins: [["rehype-slug", {}]],
  },
})

export default withMDX(nextConfig)
