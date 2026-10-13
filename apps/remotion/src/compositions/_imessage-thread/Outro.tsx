import {
  AbsoluteFill,
  Img,
  interpolate,
  Sequence,
  spring,
  useVideoConfig,
} from "remotion";
import { SmartAudio } from "../../smart-audio";
import { DESIGN_FPS, useDesignFrame } from "../../use-design-frame";
import { keyboardSfx, threadAsset } from "./asset";
import { SF_TEXT } from "./fonts";

// Seconds into the outro.
const TYPE_START = 0.25;
const PER_CHAR = 0.06;
const KEY_SFX_SECONDS = 0.1;

// Dark Google-style search bar on black types the URL; the GAIA wordmark sits small at the bottom.
export function Outro({ url }: { url: string }) {
  const frame = useDesignFrame();
  const t = frame / DESIGN_FPS;
  const { width, height, fps } = useVideoConfig();
  const chars = Array.from(url);
  const typed = chars
    .slice(0, Math.max(0, Math.floor((t - TYPE_START) / PER_CHAR) + 1))
    .join("");
  const enter = spring({
    frame,
    fps: DESIGN_FPS,
    config: { damping: 18 },
    durationInFrames: 18,
  });
  const logoIn = interpolate(t, [0.6, 1.0], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const barW = width * 0.84;
  const barH = width * 0.12;
  const fontSize = barH * 0.36;
  const caretOn = Math.floor(t * 2.4) % 2 === 0;

  return (
    <AbsoluteFill
      style={{
        background: "#000",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: barW,
          height: barH,
          borderRadius: barH / 2,
          background: "#303134",
          border: "1px solid #5F6368",
          display: "flex",
          alignItems: "center",
          gap: barH * 0.24,
          padding: `0 ${barH * 0.34}px`,
          opacity: enter,
          transform: `scale(${0.94 + 0.06 * enter})`,
          fontFamily: SF_TEXT,
          fontSize,
          color: "#E8EAED",
        }}
      >
        <GoogleG size={fontSize * 1.15} />
        <span style={{ flex: 1, whiteSpace: "nowrap" }}>
          {typed}
          <span
            style={{
              display: "inline-block",
              width: 3,
              height: fontSize * 1.1,
              marginLeft: 2,
              verticalAlign: "middle",
              background: "#8AB4F8",
              opacity: caretOn ? 1 : 0,
            }}
          />
        </span>
      </div>
      <Img
        src={threadAsset("brand/gaia-wordmark-white.webp")}
        style={{
          position: "absolute",
          bottom: height * 0.1,
          width: width * 0.3,
          opacity: logoIn,
        }}
      />
      {chars.map((c, i) => (
        <Sequence
          key={`key-${i}-${c}`}
          from={Math.round((TYPE_START + i * PER_CHAR) * fps)}
          durationInFrames={Math.max(1, Math.ceil(KEY_SFX_SECONDS * fps))}
          layout="none"
        >
          <SmartAudio src={keyboardSfx()} volume={0.35} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

function GoogleG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"
      />
    </svg>
  );
}
