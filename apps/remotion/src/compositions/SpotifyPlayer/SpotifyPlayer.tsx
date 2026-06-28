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
import { SPOTIFY_FONT } from "../../fonts";
import { proxyExternalImg } from "../../proxy-image";
import { snap } from "../../snap";
import { useCanvasLayout } from "../../use-canvas-layout";
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
  const { width, height, isLandscape, vmin } = useCanvasLayout();

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
  const float = Math.sin((frame / fps) * 1.05) * vmin(0.5);

  // Everything is sized relative to the canvas and laid out with flexbox, so
  // the whole player REFLOWS to any aspect ratio instead of uniformly scaling.
  const pad = vmin(6);
  const contentW = Math.min(width - pad * 2, height * 1.05);
  const artSize = Math.min(contentW, height * 0.46);
  const gap = vmin(isLandscape ? 2.6 : 3.4);
  // Header + bottom utility row only appear when there's spare vertical room
  // (portrait / square); landscape keeps just art → title → scrubber → controls.
  const showChrome = !isLandscape;

  return (
    <AbsoluteFill
      style={{
        background: bg,
        color: s.color,
        fontFamily: s.fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: pad,
      }}
    >
      <div
        style={{
          width: contentW,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap,
        }}
      >
        {showChrome ? (
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: enter,
            }}
          >
            <ChevronDownIcon size={vmin(4.6)} color="#ffffff" />
            <div
              style={{
                flex: 1,
                minWidth: 0,
                textAlign: "center",
                fontSize: vmin(2.6),
                fontWeight: 700,
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                padding: `0 ${vmin(1.5)}px`,
              }}
            >
              {playlist}
            </div>
            <MoreIcon size={vmin(4.6)} color="#ffffff" />
          </div>
        ) : null}

        {/* Album art */}
        <div
          style={{
            width: artSize,
            height: artSize,
            borderRadius: vmin(2),
            overflow: "hidden",
            background: "#2a2a2a",
            boxShadow: "0 40px 90px rgba(0,0,0,0.55)",
            opacity: coverSpring,
            transform: `translateY(${snap(float)}px) scale(${coverScale})`,
            flexShrink: 0,
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
                fontSize: artSize * 0.3,
                color: "rgba(255,255,255,0.25)",
              }}
            >
              ♪
            </div>
          )}
        </div>

        {/* Title + like */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: vmin(3),
            opacity: enter,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: vmin(6),
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
                gap: vmin(1.2),
                marginTop: vmin(1),
              }}
            >
              {explicit ? <ExplicitBadge size={vmin(2.8)} /> : null}
              <span
                style={{
                  fontSize: vmin(3.2),
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
          <SaveButton liked={liked} accent={accent} size={vmin(5)} />
        </div>

        {/* Scrubber */}
        <div style={{ width: "100%" }}>
          <div
            style={{
              position: "relative",
              height: vmin(0.55),
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
                width: vmin(2.1),
                height: vmin(2.1),
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
              marginTop: vmin(1.6),
              fontSize: vmin(2.2),
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
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <IconWithDot accent={accent}>
            <ShuffleIcon size={vmin(5.4)} color={accent} />
          </IconWithDot>
          <PrevIcon size={vmin(6.4)} />
          <PlayButton frame={frame} size={vmin(13)} />
          <NextIcon size={vmin(6.4)} />
          <SleepTimerIcon size={vmin(5)} color="rgba(255,255,255,0.92)" />
        </div>

        {/* Bottom utility row */}
        {showChrome ? (
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <ConnectIcon size={vmin(4.9)} color="rgba(255,255,255,0.85)" />
            <div
              style={{ display: "flex", alignItems: "center", gap: vmin(4.8) }}
            >
              <ShareIcon size={vmin(4.9)} color="rgba(255,255,255,0.85)" />
              <QueueIcon size={vmin(4.9)} color="rgba(255,255,255,0.85)" />
            </div>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
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
function PrevIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="#ffffff">
      <path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z" />
    </svg>
  );
}

function NextIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="#ffffff">
      <path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z" />
    </svg>
  );
}

// Spotify's gray "explicit" badge — a rounded square with a knocked-out E.
function ExplicitBadge({ size }: { size: number }) {
  return (
    <span
      style={{
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size * 0.19,
        background: "rgba(255,255,255,0.6)",
        color: "#2b2b2b",
        fontSize: size * 0.69,
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
        <rect x="1.4" y="7" width="5.4" height="7.6" rx="1.4" fill="#1f1f1f" />
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

function PlayButton({ frame, size }: { frame: number; size: number }) {
  // White circle with a black PAUSE glyph — the track is actively playing
  // (the scrubber advances), so Spotify shows pause, not the play triangle.
  // Gentle breathing pulse.
  const pulse = 1 + Math.sin((frame / 60) * 2.4) * 0.012;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${pulse})`,
        boxShadow: "0 14px 40px rgba(0,0,0,0.4)",
        flexShrink: 0,
      }}
    >
      <svg
        width={size * 0.41}
        height={size * 0.41}
        viewBox="0 0 24 24"
        fill="#000"
      >
        <rect x="6" y="5" width="4" height="14" rx="1.4" />
        <rect x="14" y="5" width="4" height="14" rx="1.4" />
      </svg>
    </div>
  );
}

// Spotify's "saved to library" control: a filled green circle with a white
// check when liked, otherwise a hollow "add" (+) circle.
function SaveButton({
  liked,
  accent,
  size,
}: {
  liked: boolean;
  accent: string;
  size: number;
}) {
  if (liked) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width={size * 0.55}
          height={size * 0.55}
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
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.85)"
      strokeWidth={1.6}
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="9.3" />
      <path d="M12 7.4v9.2M7.4 12h9.2" strokeLinecap="round" />
    </svg>
  );
}
