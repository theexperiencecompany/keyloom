"use client";
import type * as React from "react";

/**
 * Dual-layer crossfade that keeps blur jitter-free.
 *
 * The "right" way to do a CSS "soft blur in" — `filter: blur(N)` with N
 * animating smoothly from 12 to 0 — produces a 1-px AA wobble per frame
 * in Chromium because the Gaussian filter kernel changes sub-pixel
 * between frames and the rasterizer can't stabilize. The fix is to
 * never animate the filter value: render `children` twice (sharp + a
 * STATIC blur ghost), crossfade by opacity over the same animation
 * window. Opacity crossfading does not allocate filter buffers.
 *
 * `curve`:
 *   - "linear" (default): blur ghost opacity = 1 - progress. Use for a
 *     single element fading through one focus pull.
 *   - "bell":   blur ghost opacity = 4·p·(1−p). Use for per-character
 *     stagger so unstarted chars (progress=0) stay invisible.
 *
 * `transform`, `display`, `whiteSpace` are forwarded to the outer
 * wrapper so callers can keep their existing per-element transforms
 * (translate3d, scale, etc.) intact — both layers share that one.
 *
 * `tag` chooses the wrapper element. Default `span` keeps inline-flow
 * compatibility for per-char usage; pass `"div"` when wrapping block-
 * level content.
 */
export type BlurCrossfadeProps = {
  progress: number;
  blurPx?: number;
  curve?: "linear" | "bell";
  display?: React.CSSProperties["display"];
  transform?: React.CSSProperties["transform"];
  whiteSpace?: React.CSSProperties["whiteSpace"];
  style?: React.CSSProperties;
  tag?: "span" | "div";
  children: React.ReactNode;
};

export const BlurCrossfade: React.FC<BlurCrossfadeProps> = ({
  progress,
  blurPx = 8,
  curve = "linear",
  display = "inline-block",
  transform,
  whiteSpace,
  style,
  tag = "span",
  children,
}) => {
  const sharpOpacity = progress;
  const blurOpacity =
    curve === "bell" ? 4 * progress * (1 - progress) : 1 - progress;
  const Tag = tag;
  return (
    <Tag
      style={{
        display,
        position: "relative",
        transform,
        whiteSpace,
        ...style,
      }}
    >
      <Tag style={{ opacity: sharpOpacity, display }}>{children}</Tag>
      <Tag
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: blurOpacity,
          filter: `blur(${blurPx}px)`,
          pointerEvents: "none",
          display,
        }}
      >
        {children}
      </Tag>
    </Tag>
  );
};
