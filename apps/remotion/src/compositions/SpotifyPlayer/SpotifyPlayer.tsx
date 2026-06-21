"use client";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useVideoConfig,
} from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { FitContent } from "../../fit-content";
import { SPOTIFY_FONT } from "../../fonts";
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
  /** Shows the gray "E" explicit badge next to the artist, like Spotify. */
  explicit: boolean;
  /** Universal Style — background (gradient tint), text, font, accent. */
  clipStyle?: ClipStyle;
};

// Native design canvas — Spotify's full-screen "Now Playing" is portrait 9:16.
const W = 1080;
const H = 1920;
// Spotify's now-playing keeps the album art nearly full-bleed (~6% side margin).
const PAD = 64;

const GREEN = "#1ed760";
const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

function resolveSrc(src: string): string {
  if (!src) return "";
  // Uploaded images arrive as data: URLs (and hosted uploads briefly as blob:);
  // pass them through untouched. Without this they'd hit staticFile() below and
  // resolve to a broken path — the album cover would stay blank after upload.
  if (/^(data:|blob:)/i.test(src)) return src;
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
  explicit,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();

  const s = resolveClipStyle(clipStyle, {
    background: "#5b3a8c",
    color: "#ffffff",
    fontFamily: SPOTIFY_FONT,
    accent: GREEN,
  });
  const accent = s.accent;
  // When a background Scene is chosen, the clip's own bg is forced transparent
  // (Project.tsx) — let it show through instead of painting the gradient.
  const bg =
    s.background === "transparent"
      ? "transparent"
      : `linear-gradient(180deg, ${s.background} 0%, #1a1a1a 50%, #000000 100%)`;

  const total = Math.max(1, totalSeconds);
  // Real playback time: the counter ticks at one second per second (no
  // acceleration), and the scrubber advances at the matching real rate.
  const elapsed = Math.min(total, elapsedSeconds + frame / fps);
  const progress = elapsed / total;

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
    <FitContent designWidth={W} designHeight={H} background={bg}>
      <AbsoluteFill
        style={{
          fontFamily: s.fontFamily,
          color: s.color,
        }}
      >
        {/* Top bar */}
        <div
          style={{
            position: "absolute",
            top: 72,
            left: PAD,
            right: PAD,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: enter,
            transform: `translateY(${snap(headerY)}px)`,
          }}
        >
          <ChevronDownIcon size={54} color="#ffffff" />
          <div
            style={{
              flex: 1,
              minWidth: 0,
              textAlign: "center",
              fontSize: 29,
              fontWeight: 700,
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              padding: "0 16px",
            }}
          >
            {playlist}
          </div>
          <MoreIcon size={54} color="#ffffff" />
        </div>

        {/* Album art */}
        <div
          style={{
            position: "absolute",
            top: 196,
            left: PAD,
            width: ART,
            height: ART,
            borderRadius: 22,
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
            top: 1196,
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
                  fontSize: 72,
                  fontWeight: 700,
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
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginTop: 12,
                }}
              >
                {explicit ? <ExplicitBadge /> : null}
                <span
                  style={{
                    fontSize: 38,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.6)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {artist}
                </span>
              </div>
            </div>
            <SaveButton liked={liked} accent={accent} />
          </div>

          {/* Scrubber */}
          <div style={{ padding: `46px ${PAD}px 0` }}>
            <div
              style={{
                position: "relative",
                height: 6,
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
                  width: 24,
                  height: 24,
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
                marginTop: 20,
                fontSize: 26,
                fontWeight: 500,
                color: "rgba(255,255,255,0.62)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span>{fmtTime(elapsed)}</span>
              <span>-{fmtTime(total - elapsed)}</span>
            </div>
          </div>

          {/* Transport controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: `56px ${PAD}px 0`,
            }}
          >
            {/* Shuffle is active (green) with the small "on" dot beneath it. */}
            <IconWithDot accent={accent}>
              <ShuffleIcon size={64} color={accent} />
            </IconWithDot>
            <PrevIcon />
            <PlayButton frame={frame} />
            <NextIcon />
            <SleepTimerIcon size={60} color="rgba(255,255,255,0.92)" />
          </div>

          {/* Bottom row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: `52px ${PAD}px 0`,
            }}
          >
            <ConnectIcon size={58} color="rgba(255,255,255,0.85)" />
            <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
              <ShareIcon size={58} color="rgba(255,255,255,0.85)" />
              <QueueIcon size={58} color="rgba(255,255,255,0.85)" />
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </FitContent>
  );
};

// ---- Pieces -------------------------------------------------------------

function IconWithDot({
  accent,
  children,
}: {
  accent: string;
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
          background: accent,
        }}
      />
    </div>
  );
}

// ---- Spotify icons (pixel-accurate inline SVG, viewBox 0 0 16 16) --------

function ChevronDownIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M14 6 8 12 2 6"
        stroke={color}
        strokeWidth={2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoreIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <circle cx="2.5" cy="8" r="1.75" />
      <circle cx="8" cy="8" r="1.75" />
      <circle cx="13.5" cy="8" r="1.75" />
    </svg>
  );
}

// Spotify Encore "shuffle" — two crossing arrows.
function ShuffleIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .391 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75z" />
      <path d="M.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.978 1.167-1.797-2.14A2.25 2.25 0 0 0 .39 3.5z" />
      <path d="m7.5 10.723.98-1.167.957 1.14a2.25 2.25 0 0 0 1.724.804h1.947l-1.017-1.018a.75.75 0 1 1 1.06-1.06l2.829 2.828-2.829 2.829a.75.75 0 1 1-1.06-1.061L13.109 13H11.16a3.75 3.75 0 0 1-2.873-1.34z" />
    </svg>
  );
}

// Spotify Encore "skip-back" / "skip-forward" — solid bar + triangle.
function PrevIcon() {
  return (
    <svg width={76} height={76} viewBox="0 0 16 16" fill="#ffffff">
      <path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg width={76} height={76} viewBox="0 0 16 16" fill="#ffffff">
      <path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z" />
    </svg>
  );
}

// Spotify's gray "explicit" badge — a rounded square with a knocked-out E.
function ExplicitBadge() {
  return (
    <span
      style={{
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 6,
        background: "rgba(255,255,255,0.6)",
        color: "#2b2b2b",
        fontSize: 22,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      E
    </span>
  );
}

// Sleep-timer (stopwatch): circle with a top stem and clock hands.
function SleepTimerIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <g
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="8" cy="9.3" r="5.4" />
        <path d="M8 9.3V6.4M8 9.3l2.4 1.4" />
        <path d="M8 1.6v1.7M6.4 1.6h3.2" />
      </g>
    </svg>
  );
}

// Spotify Connect — a speaker with a small phone in front.
function ConnectIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <g stroke={color} strokeWidth={1.7} strokeLinejoin="round">
        <rect x="5.4" y="1.4" width="9.2" height="11.6" rx="1.8" />
        <circle cx="10" cy="8.6" r="2.5" />
        <circle cx="10" cy="3.9" r="0.55" fill={color} stroke="none" />
        <rect
          x="1.4"
          y="7"
          width="5.4"
          height="7.6"
          rx="1.4"
          fill="#1f1f1f"
        />
      </g>
    </svg>
  );
}

// iOS-style share — box with an upward arrow.
function ShareIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <g
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 10.4V2.1" />
        <path d="M5.1 4.8 8 1.9l2.9 2.9" />
        <path d="M4.4 7.2H3.2a1 1 0 0 0-1 1v5.2a1 1 0 0 0 1 1h9.6a1 1 0 0 0 1-1V8.2a1 1 0 0 0-1-1h-1.2" />
      </g>
    </svg>
  );
}

// Queue — three lines with a small play triangle.
function QueueIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <rect x="1.4" y="3.2" width="13.2" height="1.8" rx="0.9" />
      <rect x="1.4" y="7.1" width="13.2" height="1.8" rx="0.9" />
      <rect x="1.4" y="11" width="7" height="1.8" rx="0.9" />
      <path d="M10.4 10.1a.5.5 0 0 1 .76-.43l2.85 1.69a.5.5 0 0 1 0 .86l-2.85 1.69a.5.5 0 0 1-.76-.43v-3.38z" />
    </svg>
  );
}

function PlayButton({ frame }: { frame: number }) {
  // White circle with a black PAUSE glyph — the track is actively playing
  // (the scrubber advances), so Spotify shows pause, not the play triangle.
  // Gentle breathing pulse.
  const pulse = 1 + Math.sin((frame / 60) * 2.4) * 0.012;
  return (
    <div
      style={{
        width: 160,
        height: 160,
        borderRadius: "50%",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${pulse})`,
        boxShadow: "0 14px 40px rgba(0,0,0,0.4)",
      }}
    >
      <svg width={66} height={66} viewBox="0 0 24 24" fill="#000">
        <rect x="6" y="5" width="4" height="14" rx="1.4" />
        <rect x="14" y="5" width="4" height="14" rx="1.4" />
      </svg>
    </div>
  );
}

// Spotify's "saved to library" control: a filled green circle with a white
// check when liked, otherwise a hollow "add" (+) circle.
function SaveButton({ liked, accent }: { liked: boolean; accent: string }) {
  if (liked) {
    return (
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: "50%",
          background: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width={32}
          height={32}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#000"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.5l4.2 4.2L19 7" />
        </svg>
      </div>
    );
  }
  return (
    <svg
      width={58}
      height={58}
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
