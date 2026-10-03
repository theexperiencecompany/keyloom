"use client";

/**
 * CSS Liquid Glass — the archisvaze/liquid-glass technique.
 *
 * Real glass refracts whatever is BEHIND it, including live DOM like the
 * bubbles. The web way to bend live DOM behind an element is `backdrop-filter`
 * + an SVG `feDisplacementMap`: we paint a per-size displacement map (R = x
 * shift, G = y shift, concentrated in a lens band just inside the rounded edge)
 * and reference it from the element's `backdrop-filter`. The backdrop — the
 * message bubbles scrolling under the header — gets warped toward the edges
 * like a real glass lens, plus a blur, a translucent fill and a bright rim.
 *
 * Caveat: `backdrop-filter: url(#…)` is a live-Chromium feature (studio Player +
 * `remotion render`). The @remotion/web-renderer canvas export drops it, so the
 * fill + rim still read as glass there, just without the live refraction.
 */

import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";

/** Signed distance to a centered rounded rect (negative inside). */
function sdRoundedRect(
  px: number,
  py: number,
  hw: number,
  hh: number,
  r: number,
): number {
  const qx = Math.abs(px) - hw + r;
  const qy = Math.abs(py) - hh + r;
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(ax, ay) - r;
}

/**
 * Paint an edge-lens displacement map for a rounded rect into a data URL.
 * Inside the `band` the map points along the outward normal with a falloff, so
 * the backdrop bends toward the rim; the flat interior stays neutral (no shift).
 */
function makeDisplacementMap(
  w: number,
  h: number,
  radius: number,
  band: number,
): string {
  if (typeof document === "undefined") return "";
  const cw = Math.max(1, Math.round(w));
  const ch = Math.max(1, Math.round(h));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(cw, ch);
  const data = img.data;
  const hw = cw / 2;
  const hh = ch / 2;
  const r = Math.min(radius, hw, hh);
  const b = Math.max(1, Math.min(band, hw, hh));

  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const px = x - hw + 0.5;
      const py = y - hh + 0.5;
      const d = sdRoundedRect(px, py, hw, hh, r);
      let rEnc = 128;
      let gEnc = 128;
      if (d < 0) {
        const dist = -d;
        const e = 1;
        const gx =
          sdRoundedRect(px + e, py, hw, hh, r) -
          sdRoundedRect(px - e, py, hw, hh, r);
        const gy =
          sdRoundedRect(px, py + e, hw, hh, r) -
          sdRoundedRect(px, py - e, hw, hh, r);
        const gl = Math.hypot(gx, gy) || 1;
        const nx = gx / gl; // outward normal
        const ny = gy / gl;
        const t = Math.min(1, dist / b); // 0 at edge → 1 inner
        const mag = (1 - t) * (1 - t); // strong at the rim, 0 inside
        rEnc = Math.round(128 + nx * mag * 127);
        gEnc = Math.round(128 + ny * mag * 127);
      }
      const i = (y * cw + x) * 4;
      data[i] = rEnc;
      data[i + 1] = gEnc;
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

export function CssLiquidGlass({
  radius = 18,
  /** Refraction strength (px the backdrop is bent at the rim). */
  strength = 22,
  /** Backdrop blur (px) layered on top of the refraction. */
  blur = 3,
  glassStyle,
  className,
  style,
  children,
}: {
  radius?: number;
  strength?: number;
  blur?: number;
  /** Translucent fill + border + rim shadow painted over the refraction. */
  glassStyle?: React.CSSProperties;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const rawId = useId();
  const filterId = `glass-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w > 0 && h > 0 && (!size || size.w !== w || size.h !== h))
      setSize({ w, h });
  });

  const disp = useMemo(() => {
    if (!size) return "";
    const band = Math.min(radius * 1.4, Math.min(size.w, size.h) / 2);
    return makeDisplacementMap(size.w, size.h, radius, band);
  }, [size, radius]);

  const backdrop = disp
    ? `url(#${filterId}) blur(${blur}px) saturate(190%) brightness(1.08)`
    : `blur(${blur + 6}px) saturate(190%) brightness(1.08)`;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        borderRadius: radius,
        ...glassStyle,
        ...style,
        // Applied AFTER the spreads so the refraction always wins over any
        // backdropFilter that came in via glassStyle.
        backdropFilter: backdrop,
        // Safari can't reference an SVG filter in backdrop-filter — fall back
        // to a plain frost there.
        WebkitBackdropFilter: `blur(${blur + 6}px) saturate(160%)`,
      }}
    >
      {disp && size && (
        <svg
          aria-hidden
          width="0"
          height="0"
          style={{ position: "absolute", width: 0, height: 0 }}
        >
          <filter
            id={filterId}
            x="0"
            y="0"
            width="100%"
            height="100%"
            filterUnits="objectBoundingBox"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={disp}
              x="0"
              y="0"
              width={size.w}
              height={size.h}
              preserveAspectRatio="none"
              result="disp"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="disp"
              scale={strength}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
      )}
      {children}
    </div>
  );
}
