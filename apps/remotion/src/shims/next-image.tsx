/**
 * Shim for `next/image`. Renders a plain <img> with the same prop surface.
 * Used so @heygaia/chat-ui (extracted from a Next.js app) loads inside Remotion.
 */
import type { ImgHTMLAttributes } from "react";

type NextImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | { src: string };
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  loading?: "eager" | "lazy";
  unoptimized?: boolean;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
};

export default function Image({
  src,
  fill,
  priority: _priority,
  quality: _quality,
  unoptimized: _unoptimized,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  style,
  ...rest
}: NextImageProps) {
  const rawSrc = typeof src === "string" ? src : src?.src;
  // Allow GaiaScenario (or any composition) to override avatar/logo paths
  // baked into chat-ui's bundled JSX without forking the package.
  const overrides =
    (typeof window !== "undefined" &&
      (
        window as unknown as {
          __remotionImageOverrides?: Record<string, string>;
        }
      ).__remotionImageOverrides) ||
    {};
  const resolvedSrc = (rawSrc && overrides[rawSrc]) || rawSrc;
  const fillStyle = fill
    ? {
        position: "absolute" as const,
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover" as const,
      }
    : undefined;
  return <img src={resolvedSrc} style={{ ...fillStyle, ...style }} {...rest} />;
}

export { Image };
