"use client";
import {
  ArrowDown01Icon,
  ComputerDesk01Icon,
  MoreHorizontalIcon,
  RepeatIcon,
  Share08Icon,
  ShuffleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useVideoConfig,
} from "remotion";
import { FitContent } from "../../fit-content";
import { proxyExternalImg } from "../../proxy-image";
import { snap } from "../../snap";
import { useDesignFrame } from "../../use-design-frame";

export type SpotifyPlayerProps = {
  albumArt: string;
  trackTitle: string;
  artist: string;
  playlist: string;
  /** Where the progress bar starts, in seconds. It advances as the clip plays. */
  elapsedSeconds: number;
  /** Total track length, in seconds. */
  totalSeconds: number;
  liked: boolean;
  /** Top-of-gradient tint — Spotify derives this from the album art. */
  tint: string;
};

// Native design canvas — Spotify's full-screen "Now Playing" is portrait 9:16.
const W = 1080;
const H = 1920;
const PAD = 72;

const SPOTIFY_GREEN = "#1ed760";
const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

function resolveSrc(src: string): string {
  if (!src) return "";
  if (/^https?:/i.test(src)) return proxyExternalImg(src);
  return staticFile(src.replace(/^\//, ""));
}

function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({
  albumArt,
  trackTitle,
  artist,
  playlist,
  elapsedSeconds,
  totalSeconds,
  liked,
  tint,
}) => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();

  const playedSec = frame / fps;
  const total = Math.max(1, totalSeconds);
  const elapsed = Math.min(total, elapsedSeconds + playedSec);
  const progress = Math.min(1, elapsed / total);

  // Entrance: the whole card eases up + fades; album art springs in a touch.
  const enter = interpolate(frame, [0, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: APPLE_EASE,
  });
  const coverSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 95, mass: 0.9 },
  });
  const coverScale = 0.92 + coverSpring * 0.08;
  // Slow, barely-there vertical float so the art feels "alive" while playing.
  const float = Math.sin((frame / fps) * 1.05) * 7;

  const headerY = (1 - enter) * -18;
  const bodyY = (1 - enter) * 30;

  const TRACK_W = W - PAD * 2;

  return (
    <FitContent
      designWidth={W}
      designHeight={H}
      background={`linear-gradient(180deg, ${tint} 0%, #1c1c1c 52%, #000000 100%)`}
    >
      <AbsoluteFill
        style={{
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
          color: "#ffffff",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            position: "absolute",
            top: 64,
            left: PAD,
            right: PAD,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: enter,
            transform: `translateY(${snap(headerY)}px)`,
          }}
        >
          <HugeiconsIcon icon={ArrowDown01Icon} size={44} color="#ffffff" />
          <div style={{ textAlign: "center", lineHeight: 1.35 }}>
            <div
              style={{
                fontSize: 19,
                fontWeight: 700,
                letterSpacing: "0.16em",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              PLAYING FROM PLAYLIST
            </div>
            <div style={{ fontSize: 25, fontWeight: 700, marginTop: 4 }}>
              {playlist}
            </div>
          </div>
          <HugeiconsIcon icon={MoreHorizontalIcon} size={44} color="#ffffff" />
        </div>

        {/* Album art */}
        <div
          style={{
            position: "absolute",
            top: 260,
            left: PAD,
            width: TRACK_W,
            height: TRACK_W,
            borderRadius: 18,
            overflow: "hidden",
            background: "#2a2a2a",
            boxShadow: "0 60px 120px rgba(0,0,0,0.55)",
            opacity: coverSpring,
            transform: `translateY(${snap(float)}px) scale(${coverScale})`,
          }}
        >
          {albumArt ? (
            <Img
              src={resolveSrc(albumArt)}
              crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 220,
                color: "rgba(255,255,255,0.25)",
              }}
            >
              ♪
            </div>
          )}
        </div>

        {/* Lower block: title, scrubber, controls */}
        <div
          style={{
            position: "absolute",
            top: 1300,
            left: 0,
            right: 0,
            opacity: enter,
            transform: `translateY(${snap(bodyY)}px)`,
          }}
        >
          {/* Title + like */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              padding: `0 ${PAD}px`,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 58,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {trackTitle}
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.62)",
                  marginTop: 8,
                }}
              >
                {artist}
              </div>
            </div>
            <HeartIcon liked={liked} />
          </div>

          {/* Scrubber */}
          <div style={{ padding: `54px ${PAD}px 0` }}>
            <div
              style={{
                position: "relative",
                height: 6,
                borderRadius: 999,
                background: "rgba(255,255,255,0.28)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${progress * 100}%`,
                  borderRadius: 999,
                  background: "#ffffff",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: `${progress * 100}%`,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#ffffff",
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 16,
                fontSize: 24,
                fontWeight: 500,
                color: "rgba(255,255,255,0.6)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span>{fmtTime(elapsed)}</span>
              <span>{fmtTime(total)}</span>
            </div>
          </div>

          {/* Transport controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: `64px ${PAD + 6}px 0`,
            }}
          >
            <HugeiconsIcon
              icon={ShuffleIcon}
              size={48}
              color={SPOTIFY_GREEN}
              strokeWidth={2}
            />
            <PrevIcon />
            <PlayButton frame={frame} />
            <NextIcon />
            <HugeiconsIcon
              icon={RepeatIcon}
              size={48}
              color="rgba(255,255,255,0.85)"
              strokeWidth={2}
            />
          </div>

          {/* Bottom row: device + share */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: `72px ${PAD}px 0`,
              color: SPOTIFY_GREEN,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <HugeiconsIcon
                icon={ComputerDesk01Icon}
                size={34}
                color={SPOTIFY_GREEN}
              />
              <span
                style={{ fontSize: 22, fontWeight: 600, color: SPOTIFY_GREEN }}
              >
                {artist}'s Studio
              </span>
            </div>
            <HugeiconsIcon
              icon={Share08Icon}
              size={34}
              color="rgba(255,255,255,0.85)"
            />
          </div>
        </div>
      </AbsoluteFill>
    </FitContent>
  );
};

// ---- Filled transport glyphs (Spotify-accurate) -------------------------

function PrevIcon() {
  return (
    <svg width={56} height={56} viewBox="0 0 24 24" fill="#ffffff">
      <rect x="5.5" y="5" width="2.4" height="14" rx="1.2" />
      <path d="M20 5.4v13.2L9.5 12z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg width={56} height={56} viewBox="0 0 24 24" fill="#ffffff">
      <path d="M4 5.4v13.2L14.5 12z" />
      <rect x="16.1" y="5" width="2.4" height="14" rx="1.2" />
    </svg>
  );
}

function PlayButton({ frame }: { frame: number }) {
  // Gentle breathing pulse on the play knob — reads as "alive / playing".
  const pulse = 1 + Math.sin((frame / 60) * 2.4) * 0.015;
  return (
    <div
      style={{
        width: 156,
        height: 156,
        borderRadius: "50%",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${pulse})`,
        boxShadow: "0 12px 36px rgba(0,0,0,0.4)",
      }}
    >
      <svg width={62} height={62} viewBox="0 0 24 24" fill="#000000">
        <path d="M7 4.5v15L20 12z" />
      </svg>
    </div>
  );
}

function HeartIcon({ liked }: { liked: boolean }) {
  if (liked) {
    return (
      <svg width={46} height={46} viewBox="0 0 24 24" fill="#1ed760">
        <path d="M12 21s-7.5-4.9-10-9.2C.4 8.6 2 5 5.4 5c2 0 3.4 1.2 4.6 2.7C11.2 6.2 12.6 5 14.6 5 18 5 19.6 8.6 22 11.8 19.5 16.1 12 21 12 21z" />
      </svg>
    );
  }
  return (
    <svg
      width={46}
      height={46}
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.85)"
      strokeWidth={1.6}
    >
      <circle cx="12" cy="12" r="9.2" />
      <path d="M12 7.5v9M7.5 12h9" strokeLinecap="round" />
    </svg>
  );
}
