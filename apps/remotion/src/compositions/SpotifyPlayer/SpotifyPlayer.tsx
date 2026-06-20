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
const PAD = 80;

const GREEN = "#1ed760";
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
  const { fps, durationInFrames } = useVideoConfig();

  const total = Math.max(1, totalSeconds);
  // Drive the scrubber clearly across the clip so it visibly reads as "playing"
  // — start where the user set it, then advance a noticeable chunk by the end.
  const startP = Math.min(0.92, Math.max(0, elapsedSeconds / total));
  const endP = Math.min(0.98, startP + 0.26);
  const progress = interpolate(
    frame,
    [0, durationInFrames - 1],
    [startP, endP],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const elapsed = progress * total;

  // Entrance.
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
  const coverScale = 0.93 + coverSpring * 0.07;
  const float = Math.sin((frame / fps) * 1.05) * 8;
  const headerY = (1 - enter) * -18;
  const bodyY = (1 - enter) * 34;

  const ART = W - PAD * 2;

  return (
    <FitContent
      designWidth={W}
      designHeight={H}
      background={`linear-gradient(180deg, ${tint} 0%, #1a1a1a 50%, #000000 100%)`}
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
            top: 78,
            left: PAD,
            right: PAD,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: enter,
            transform: `translateY(${snap(headerY)}px)`,
          }}
        >
          <HugeiconsIcon icon={ArrowDown01Icon} size={56} color="#ffffff" />
          <div style={{ textAlign: "center", lineHeight: 1.4 }}>
            <div
              style={{
                fontSize: 21,
                fontWeight: 800,
                letterSpacing: "0.18em",
                color: "rgba(255,255,255,0.72)",
              }}
            >
              PLAYING FROM PLAYLIST
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>
              {playlist}
            </div>
          </div>
          <HugeiconsIcon icon={MoreHorizontalIcon} size={56} color="#ffffff" />
        </div>

        {/* Album art */}
        <div
          style={{
            position: "absolute",
            top: 250,
            left: PAD,
            width: ART,
            height: ART,
            borderRadius: 20,
            overflow: "hidden",
            background: "#2a2a2a",
            boxShadow: "0 70px 130px rgba(0,0,0,0.6)",
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
                fontSize: 240,
                color: "rgba(255,255,255,0.25)",
              }}
            >
              ♪
            </div>
          )}
        </div>

        {/* Lower block */}
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
              gap: 28,
              padding: `0 ${PAD}px`,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 66,
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {trackTitle}
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.6)",
                  marginTop: 10,
                }}
              >
                {artist}
              </div>
            </div>
            <Heart liked={liked} />
          </div>

          {/* Scrubber */}
          <div style={{ padding: `60px ${PAD}px 0` }}>
            <div
              style={{
                position: "relative",
                height: 9,
                borderRadius: 999,
                background: "rgba(255,255,255,0.3)",
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
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "#ffffff",
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 3px 8px rgba(0,0,0,0.45)",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 20,
                fontSize: 27,
                fontWeight: 500,
                color: "rgba(255,255,255,0.62)",
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
              padding: `74px ${PAD}px 0`,
            }}
          >
            <IconWithDot active>
              <HugeiconsIcon
                icon={ShuffleIcon}
                size={66}
                color={GREEN}
                strokeWidth={2.2}
              />
            </IconWithDot>
            <PrevIcon />
            <PlayPauseButton frame={frame} />
            <NextIcon />
            <HugeiconsIcon
              icon={RepeatIcon}
              size={66}
              color="rgba(255,255,255,0.9)"
              strokeWidth={2.2}
            />
          </div>

          {/* Bottom row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: `78px ${PAD}px 0`,
            }}
          >
            <HugeiconsIcon icon={ComputerDesk01Icon} size={44} color={GREEN} />
            <HugeiconsIcon
              icon={Share08Icon}
              size={44}
              color="rgba(255,255,255,0.85)"
            />
          </div>
        </div>
      </AbsoluteFill>
    </FitContent>
  );
};

// ---- Pieces -------------------------------------------------------------

function IconWithDot({
  active,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      {children}
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: active ? GREEN : "transparent",
        }}
      />
    </div>
  );
}

function PrevIcon() {
  return (
    <svg width={96} height={96} viewBox="0 0 24 24" fill="#ffffff">
      <rect x="5" y="4.5" width="2.8" height="15" rx="1.4" />
      <path d="M20.5 4.8v14.4L9 12z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg width={96} height={96} viewBox="0 0 24 24" fill="#ffffff">
      <path d="M3.5 4.8v14.4L15 12z" />
      <rect x="16.2" y="4.5" width="2.8" height="15" rx="1.4" />
    </svg>
  );
}

function PlayPauseButton({ frame }: { frame: number }) {
  // Currently playing → show the PAUSE control. Gentle breathing pulse.
  const pulse = 1 + Math.sin((frame / 60) * 2.4) * 0.012;
  return (
    <div
      style={{
        width: 208,
        height: 208,
        borderRadius: "50%",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
        transform: `scale(${pulse})`,
        boxShadow: "0 16px 44px rgba(0,0,0,0.45)",
      }}
    >
      <span
        style={{ width: 22, height: 78, borderRadius: 4, background: "#000" }}
      />
      <span
        style={{ width: 22, height: 78, borderRadius: 4, background: "#000" }}
      />
    </div>
  );
}

function Heart({ liked }: { liked: boolean }) {
  if (liked) {
    return (
      <svg width={56} height={56} viewBox="0 0 24 24" fill={GREEN}>
        <path d="M12 21s-7.4-4.7-9.8-9C.7 8.8 2.1 5 5.6 5c2 0 3.3 1.2 4.4 2.6C11.1 6.2 12.4 5 14.4 5 17.9 5 19.3 8.8 21.8 12c-2.4 4.3-9.8 9-9.8 9z" />
      </svg>
    );
  }
  return (
    <svg
      width={56}
      height={56}
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.85)"
      strokeWidth={1.6}
    >
      <circle cx="12" cy="12" r="9.3" />
      <path d="M12 7.4v9.2M7.4 12h9.2" strokeLinecap="round" />
    </svg>
  );
}
