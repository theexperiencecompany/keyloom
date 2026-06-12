"use client";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useVideoConfig,
} from "remotion";
import { proxyExternalImg } from "../../proxy-image";
import { snap } from "../../snap";
import { useDesignFrame } from "../../use-design-frame";

const DEFAULT_ICON_SRC = staticFile("message_icon.png");
const DEFAULT_WALLPAPER_SRC = "wallpaper.png";

/**
 * Resolve an asset path to a renderable URL:
 *   - data: / blob: URIs pass through unchanged
 *   - absolute http(s) URLs route through `/api/img/<encoded>` so the
 *     export canvas stays untainted
 *   - relative paths get `staticFile()`'d for the Remotion bundle server
 */
function resolveAsset(src: string | undefined): string | undefined {
  if (!src) return undefined;
  if (/^(data:|blob:)/i.test(src)) return src;
  if (/^https?:/i.test(src)) return proxyExternalImg(src);
  return staticFile(src.replace(/^\//, ""));
}

export type LockScreenMessageProps = {
  /** Big lock-screen clock, e.g. "9:41". */
  time: string;
  /** Date line above the clock, e.g. "Tue Apr 1". */
  date: string;
  /** Wallpaper image — falls back to the bundled wallpaper.png. */
  wallpaper?: string;

  // Up to three stacked notifications (newest on top). Empty slots — no
  // sender and no body — are skipped, so 1–3 cards render.
  n1Sender: string;
  n1Title?: string;
  n1Body: string;
  n1Time: string;
  n1Avatar?: string;

  n2Sender?: string;
  n2Title?: string;
  n2Body?: string;
  n2Time?: string;
  n2Avatar?: string;

  n3Sender?: string;
  n3Title?: string;
  n3Body?: string;
  n3Time?: string;
  n3Avatar?: string;
};

type Notif = {
  sender: string;
  title?: string;
  body: string;
  time: string;
  avatar?: string;
};

// Frame offsets (design fps = 60).
const D_CLOCK = 0;
const D_NOTIF_START = 14;
const GHOST_STAGGER = 5;

// Collapsed-deck metrics (iOS lock screen): each card behind the hero is inset
// (narrower) and pushed down so only a sliver peeks out below it.
const STACK_PEEK = 34; // px each deeper card sticks out below
const STACK_INSET = 28; // px each deeper card narrows per side

function collectNotifs(p: LockScreenMessageProps): Notif[] {
  const raw: Notif[] = [
    {
      sender: p.n1Sender,
      title: p.n1Title,
      body: p.n1Body,
      time: p.n1Time,
      avatar: p.n1Avatar,
    },
    {
      sender: p.n2Sender ?? "",
      title: p.n2Title,
      body: p.n2Body ?? "",
      time: p.n2Time ?? "",
      avatar: p.n2Avatar,
    },
    {
      sender: p.n3Sender ?? "",
      title: p.n3Title,
      body: p.n3Body ?? "",
      time: p.n3Time ?? "",
      avatar: p.n3Avatar,
    },
  ];
  return raw.filter((n) => n.sender.trim() !== "" || n.body.trim() !== "");
}

export const LockScreenMessage: React.FC<LockScreenMessageProps> = (props) => {
  const { time, date, wallpaper } = props;
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();

  const wallpaperSrc =
    resolveAsset(wallpaper) ?? staticFile(DEFAULT_WALLPAPER_SRC);
  const notifs = collectNotifs(props);

  // Clock easing — gentle fade + settle, no bounce.
  const clockIn = interpolate(frame - D_CLOCK, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const clockY = (1 - clockIn) * 16;

  return (
    <AbsoluteFill
      style={{
        background: "#0c1018",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
        overflow: "hidden",
      }}
    >
      <Img
        src={wallpaperSrc}
        alt=""
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Legibility scrims — darken top and bottom so chrome reads over
          any wallpaper. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.40) 100%)",
        }}
      />

      <StatusBar />

      {/* Clock cluster */}
      <div
        style={{
          position: "absolute",
          top: 158,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "#fff",
          opacity: clockIn,
          transform: `translate3d(0, ${snap(clockY)}px, 0)`,
        }}
      >
        <div
          style={{
            fontSize: 42,
            fontWeight: 600,
            letterSpacing: "0.01em",
            textShadow: "0 2px 14px rgba(0,0,0,0.3)",
          }}
        >
          {date}
        </div>
        <div
          style={{
            fontSize: 250,
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            marginTop: 2,
            color: "rgba(255,255,255,0.96)",
            textShadow: "0 6px 40px rgba(0,0,0,0.32)",
          }}
        >
          {time}
        </div>
      </div>

      {/* Notification deck — anchored to the lower portion like iOS. */}
      {notifs.length > 0 && (
        <div style={{ position: "absolute", left: 36, right: 36, top: 1230 }}>
          <NotificationStack notifs={notifs} frame={frame} fps={fps} />
        </div>
      )}

      <BottomChrome />
    </AbsoluteFill>
  );
};

function StatusBar() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 96,
        padding: "0 56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        color: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Cellular */}
        <svg width="38" height="26" viewBox="0 0 36 24" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={i * 9}
              y={14 - i * 4}
              width="6"
              height={6 + i * 4}
              rx="1.5"
              fill="#fff"
            />
          ))}
        </svg>
        {/* Wifi */}
        <svg width="34" height="26" viewBox="0 0 32 24" aria-hidden fill="#fff">
          <path d="M16 19.5l3.2-4a4 4 0 0 0-6.4 0l3.2 4Zm0-9a10 10 0 0 1 7.6 3.5l2.4-3A14 14 0 0 0 16 6.5 14 14 0 0 0 6 14l2.4 3A10 10 0 0 1 16 10.5Z" />
        </svg>
        {/* Battery */}
        <svg width="46" height="26" viewBox="0 0 44 24" aria-hidden>
          <rect
            x="1"
            y="5"
            width="34"
            height="14"
            rx="4"
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.6"
          />
          <rect x="3.5" y="7.5" width="27" height="9" rx="2" fill="#fff" />
          <rect
            x="37"
            y="9.5"
            width="3"
            height="5"
            rx="1.5"
            fill="rgba(255,255,255,0.5)"
          />
        </svg>
      </div>
    </div>
  );
}

/**
 * Collapsed iOS deck: the newest notification renders full and readable on
 * top (in flow, so it sets the stack's height); every older one tucks behind
 * it as a narrower, dimmed glass card pushed down so just a sliver peeks out
 * below — the recognizable lock-screen pile.
 */
function NotificationStack({
  notifs,
  frame,
  fps,
}: {
  notifs: Notif[];
  frame: number;
  fps: number;
}) {
  const ghosts = notifs.slice(1, 3); // up to two cards behind the hero
  return (
    <div style={{ position: "relative" }}>
      {/* Deeper cards first so they paint behind the hero. */}
      {ghosts.map((_, k) => (
        <GhostCard key={k} depth={k + 1} frame={frame} fps={fps} />
      ))}
      <NotificationCard
        frame={frame}
        fps={fps}
        delay={D_NOTIF_START}
        notif={notifs[0]!}
      />
    </div>
  );
}

/** A blank glass card peeking out behind the hero notification. */
function GhostCard({
  depth,
  frame,
  fps,
}: {
  depth: number;
  frame: number;
  fps: number;
}) {
  const pop = spring({
    frame: frame - (D_NOTIF_START + depth * GHOST_STAGGER),
    fps,
    config: { damping: 18, stiffness: 150, mass: 0.9 },
  });
  // Rest at its peek offset; slide up into place from below on entrance.
  const y = depth * STACK_PEEK + (1 - pop) * 32;
  const inset = depth * STACK_INSET;
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: inset,
        right: inset,
        height: "100%",
        zIndex: 1,
        borderRadius: 38,
        background: `rgba(60,64,76,${0.34 - depth * 0.05})`,
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 18px 44px rgba(0,0,0,0.20)",
        backdropFilter: "blur(30px) saturate(150%)",
        WebkitBackdropFilter: "blur(30px) saturate(150%)",
        transform: `translate3d(0, ${snap(y)}px, 0)`,
        opacity: pop,
        filter: `brightness(${1 - depth * 0.1})`,
      }}
    />
  );
}

const AVATAR = 82;
const BADGE = 34;

function NotificationCard({
  frame,
  fps,
  delay,
  notif,
}: {
  frame: number;
  fps: number;
  delay: number;
  notif: Notif;
}) {
  const pop = spring({
    frame: frame - delay,
    fps,
    config: { damping: 16, stiffness: 150, mass: 0.9 },
  });
  const scale = 0.94 + pop * 0.06;
  const translateY = (1 - pop) * 60;

  const avatarSrc = resolveAsset(notif.avatar);

  return (
    <div
      style={{
        position: "relative",
        zIndex: 2,
        borderRadius: 38,
        // Neutral frosted glass — light enough to read as iOS material,
        // dark enough to keep white text legible over any wallpaper.
        // rgba base survives web-renderer exports; blur is enhancement.
        background: "rgba(70,74,86,0.34)",
        border: "1px solid rgba(255,255,255,0.16)",
        boxShadow: "0 18px 44px rgba(0,0,0,0.22)",
        backdropFilter: "blur(30px) saturate(150%)",
        WebkitBackdropFilter: "blur(30px) saturate(150%)",
        padding: "24px 26px",
        display: "flex",
        gap: 20,
        alignItems: "flex-start",
        opacity: pop,
        transform: `translate3d(0, ${snap(translateY)}px, 0) scale(${scale})`,
        transformOrigin: "center bottom",
      }}
    >
      {/* Avatar (round, with Messages badge) or app icon (rounded square) */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        {avatarSrc ? (
          <>
            <Img
              src={avatarSrc}
              alt={notif.sender}
              width={AVATAR}
              height={AVATAR}
              style={{
                width: AVATAR,
                height: AVATAR,
                borderRadius: 9999,
                objectFit: "cover",
              }}
            />
            <Img
              src={DEFAULT_ICON_SRC}
              alt=""
              width={BADGE}
              height={BADGE}
              style={{
                position: "absolute",
                left: -4,
                bottom: -4,
                width: BADGE,
                height: BADGE,
                borderRadius: 9,
                border: "2px solid rgba(255,255,255,0.25)",
              }}
            />
          </>
        ) : (
          <Img
            src={DEFAULT_ICON_SRC}
            alt={notif.sender}
            width={AVATAR}
            height={AVATAR}
            style={{ width: AVATAR, height: AVATAR, borderRadius: 19 }}
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 2,
          }}
        >
          <span
            style={{
              fontSize: 34,
              fontWeight: 600,
              color: "#fff",
              letterSpacing: "-0.01em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {notif.sender}
          </span>
          <span
            style={{
              fontSize: 25,
              color: "rgba(255,255,255,0.6)",
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            {notif.time}
          </span>
        </div>
        {notif.title && notif.title.trim() !== "" && (
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              color: "#fff",
              letterSpacing: "-0.01em",
              marginBottom: 2,
            }}
          >
            {notif.title}
          </div>
        )}
        <div
          style={{
            fontSize: 31,
            color: "rgba(255,255,255,0.9)",
            fontWeight: 400,
            lineHeight: 1.32,
            letterSpacing: "-0.005em",
          }}
        >
          {notif.body}
        </div>
      </div>
    </div>
  );
}

function BottomChrome() {
  return (
    <>
      {/* Flashlight + Camera quick-action buttons */}
      <div
        style={{
          position: "absolute",
          bottom: 116,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-between",
          padding: "0 70px",
        }}
      >
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              width: 96,
              height: 96,
              borderRadius: 9999,
              background: "rgba(0,0,0,0.30)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            {i === 0 ? <FlashlightIcon /> : <CameraIcon />}
          </div>
        ))}
      </div>

      {/* Home indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          left: "50%",
          transform: "translateX(-50%)",
          width: 300,
          height: 10,
          borderRadius: 9999,
          background: "rgba(255,255,255,0.85)",
        }}
      />
    </>
  );
}

function FlashlightIcon() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3h10l-1.5 5.5v0a2 2 0 0 1-.5 1.3L13 12v8a1 1 0 0 1-1 1h0a1 1 0 0 1-1-1v-8L9 9.8A2 2 0 0 1 8.5 8.5L7 3Z" />
      <path d="M12 13.5v2" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2a1 1 0 0 0 .8-.4l.9-1.2a1 1 0 0 1 .8-.4h3.6a1 1 0 0 1 .8.4l.9 1.2a1 1 0 0 0 .8.4h1.2A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-8Z" />
      <circle cx="12" cy="12.5" r="3.4" />
    </svg>
  );
}
