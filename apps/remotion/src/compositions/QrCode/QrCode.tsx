"use client";
import QRCode from "qrcode";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Img,
  spring,
  staticFile,
  useVideoConfig,
} from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { proxyExternalImg } from "../../proxy-image";
import { useDesignFrame } from "../../use-design-frame";
import { QR_LOGO_PRESETS, resolveQrLogo } from "./logo-presets";

export type QrCodeProps = {
  value: string;
  caption: string;
  /** Visual style of QR modules. */
  moduleStyle: "squares" | "dots";
  /** Preset key for the centered logo, or "none". `logoCustom` overrides. */
  logoPreset: string;
  /** Custom logo path or URL. If set, takes precedence over `logoPreset`. */
  logoCustom: string;
  logoPadding: number;
  clipStyle?: ClipStyle;
};

function resolveAsset(src: string | undefined): string | undefined {
  if (!src) return undefined;
  if (/^(data:|blob:)/i.test(src)) return src;
  if (/^https?:/i.test(src)) return proxyExternalImg(src);
  return staticFile(src.replace(/^\//, ""));
}

type Matrix = { size: number; bits: Uint8Array };

function buildMatrix(value: string): Matrix {
  const safe = value.trim() || "https://heygaia.io";
  const qr = QRCode.create(safe, { errorCorrectionLevel: "H" });
  const size = qr.modules.size;
  const bits = qr.modules.data as Uint8Array;
  return { size, bits };
}

function QrSvg({
  matrix,
  fg,
  bg,
  style,
  pixelSize,
  frame,
  fps,
}: {
  matrix: Matrix;
  fg: string;
  bg: string;
  style: "squares" | "dots";
  pixelSize: number;
  frame: number;
  fps: number;
}) {
  const { size, bits } = matrix;
  const total = size * pixelSize;
  const cells: React.ReactNode[] = [];

  const STAGGER_TOTAL = 36;
  const CELL_DURATION = 24;
  const ctr = (size - 1) / 2;
  const maxDist = Math.max(1, ctr + ctr);

  function cellProgress(r: number, c: number): number {
    const dist = Math.abs(r - ctr) + Math.abs(c - ctr);
    const delay = Math.round((dist / maxDist) * STAGGER_TOTAL);
    return spring({
      frame: frame - delay,
      fps,
      durationInFrames: CELL_DURATION,
      config: { damping: 14, stiffness: 140, mass: 0.7 },
    });
  }

  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFinder(r, c)) continue;
      const on = bits[r * size + c];
      if (!on) continue;
      const x = c * pixelSize;
      const y = r * pixelSize;
      const p = cellProgress(r, c);
      // Cells whose stagger delay hasn't elapsed get skipped — keeps the
      // SVG node count down during the early frames of the wave.
      if (p <= 0.001) continue;
      const tx = x + pixelSize / 2;
      const ty = y + pixelSize / 2;
      const transform = `translate(${tx} ${ty}) scale(${p}) translate(${-tx} ${-ty})`;
      const opacity = Math.min(1, p);
      if (style === "dots") {
        cells.push(
          <circle
            key={`${r}-${c}`}
            cx={tx}
            cy={ty}
            r={pixelSize * 0.45}
            fill={fg}
            opacity={opacity}
            transform={transform}
          />,
        );
      } else {
        cells.push(
          <rect
            key={`${r}-${c}`}
            x={x}
            y={y}
            width={pixelSize}
            height={pixelSize}
            fill={fg}
            opacity={opacity}
            transform={transform}
          />,
        );
      }
    }
  }

  // Finder pattern: outer 7×7 rounded square ring + inner 3×3 rounded
  // square. Coords given as (row, col) of the top-left module. Animates
  // with the same radial-stagger spring as the surrounding cells (timing
  // is taken from the finder's center module).
  const finder = (r: number, c: number, key: string) => {
    const outer = pixelSize * 7;
    const innerSize = pixelSize * 3;
    const ringR = style === "dots" ? pixelSize * 1.6 : pixelSize * 0.6;
    const innerR = style === "dots" ? pixelSize * 0.9 : pixelSize * 0.3;
    const p = cellProgress(r + 3, c + 3);
    if (p <= 0.001) return null;
    const fx = (c + 3.5) * pixelSize;
    const fy = (r + 3.5) * pixelSize;
    return (
      <g
        key={key}
        opacity={Math.min(1, p)}
        transform={`translate(${fx} ${fy}) scale(${p}) translate(${-fx} ${-fy})`}
      >
        <rect
          x={c * pixelSize}
          y={r * pixelSize}
          width={outer}
          height={outer}
          rx={ringR}
          ry={ringR}
          fill={fg}
        />
        <rect
          x={(c + 1) * pixelSize}
          y={(r + 1) * pixelSize}
          width={pixelSize * 5}
          height={pixelSize * 5}
          rx={ringR * 0.65}
          ry={ringR * 0.65}
          fill={bg}
        />
        <rect
          x={(c + 2) * pixelSize}
          y={(r + 2) * pixelSize}
          width={innerSize}
          height={innerSize}
          rx={innerR}
          ry={innerR}
          fill={fg}
        />
      </g>
    );
  };

  return (
    <svg
      width={total}
      height={total}
      viewBox={`0 0 ${total} ${total}`}
      shapeRendering="crispEdges"
      style={{ display: "block" }}
    >
      <rect x={0} y={0} width={total} height={total} fill={bg} />
      {cells}
      {finder(0, 0, "tl")}
      {finder(0, size - 7, "tr")}
      {finder(size - 7, 0, "bl")}
    </svg>
  );
}

export const QrCode: React.FC<QrCodeProps> = ({
  value,
  caption,
  moduleStyle,
  logoPreset,
  logoCustom,
  logoPadding,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();
  const s = resolveClipStyle(clipStyle, {
    background: "#ffffff",
    color: "#0f1014",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#0a84ff",
  });

  const matrix = useMemo(() => buildMatrix(value), [value]);
  const qrPx = 720;
  const pixelSize = Math.floor(qrPx / matrix.size);
  const renderedSize = pixelSize * matrix.size;

  const logoSrc = logoCustom.trim()
    ? resolveAsset(logoCustom)
    : resolveAsset(resolveQrLogo(logoPreset));

  const wrapperFade = spring({
    frame,
    fps,
    durationInFrames: 12,
    config: { damping: 16, stiffness: 200, mass: 0.6 },
  });
  const logoEnter = spring({
    frame: frame - 36,
    fps,
    durationInFrames: 18,
    config: { damping: 13, stiffness: 160, mass: 0.7 },
  });

  const logoPlate = Math.round(renderedSize * 0.26);

  return (
    <AbsoluteFill
      style={{
        background: s.background,
        color: s.color,
        fontFamily: s.fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 36,
          opacity: wrapperFade,
        }}
      >
        <div style={{ position: "relative" }}>
          <QrSvg
            matrix={matrix}
            fg={s.color}
            bg={s.background}
            style={moduleStyle}
            pixelSize={pixelSize}
            frame={frame}
            fps={fps}
          />
          {logoSrc ? (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: logoPlate,
                height: logoPlate,
                background: logoPadding > 0 ? s.background : "transparent",
                padding: Math.max(0, logoPadding),
                borderRadius: logoPlate * 0.22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: logoEnter,
                transform: `translate(-50%, -50%) scale(${0.6 + logoEnter * 0.4})`,
              }}
            >
              <Img
                src={logoSrc}
                crossOrigin="anonymous"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  borderRadius: logoPlate * 0.18,
                }}
              />
            </div>
          ) : null}
        </div>
        {caption.trim() ? (
          <div
            style={{
              fontSize: 30,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              textAlign: "center",
              color: s.color,
              maxWidth: 1000,
            }}
          >
            {caption.trim()}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export { QR_LOGO_PRESETS };
