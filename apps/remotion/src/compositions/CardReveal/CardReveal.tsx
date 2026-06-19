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
import { proxyExternalImg } from "../../proxy-image";
import { useDesignFrame } from "../../use-design-frame";

export type CardRevealProps = {
  /** The image revealed on the card front (upload, static path, or URL). */
  image: string;
  /** Optional caption that fades in beneath the card. */
  caption: string;
  clipStyle?: ClipStyle;
};

/**
 * A 4-second reveal sting built on flat, solid colors — no gradients, no
 * glow/lighting, no busy background:
 *
 *   0.0–0.95s  a white ball falls under real gravity and settles with one
 *              clean bounce; a contact shadow tightens + darkens as it lands,
 *              and an impact ripple rings out across the floor
 *   0.95–1.7s  the ball *gathers* (anticipation), then springs open into a
 *              soft-cornered square (circle → square, with a little overshoot)
 *   1.7–2.5s   the square winds back, then flips on its vertical axis to reveal
 *              the image; a thin accent focus-frame snaps in around it
 *   ~2.4s      a confetti blast fires as the image lands
 *   2.6–4.0s   everything settles; the caption fades in
 *
 * The motion is the point: gravity ease-in, squash/stretch, anticipation and
 * follow-through, spring overshoot. The image comes from the sibling Image
 * field; background/text/font/accent come from the shared Style controls.
 * Built from flat fills + a contact shadow so it survives web-renderer export.
 */

const SMOOTH = Easing.bezier(0.22, 1, 0.36, 1);

// Timeline (design frames @ 60fps).
const DROP_END = 56;
const MORPH_START = 60;
const MORPH_END = 104;
const FLIP_START = 108;
const FLIP_END = 152;
const BURST = 144;
const CAP_START = 162;
const CAP_END = 216;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOutCubic = (k: number) => 1 - (1 - k) ** 3;

/** Deterministic per-particle pseudo-random (stable across renders). */
function rand(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Bouncing-ball height profile: 1 (top) → 0 (floor), one clean bounce + a tap. */
function dropHeight(p: number): number {
  if (p < 0.5) {
    const u = p / 0.5;
    return 1 - u * u; // accelerating fall (gravity)
  }
  if (p < 0.76) {
    const u = (p - 0.5) / 0.26;
    return 0.16 * Math.sin(Math.PI * u); // one soft bounce
  }
  if (p < 1) {
    const u = (p - 0.76) / 0.24;
    return 0.04 * Math.sin(Math.PI * u); // tiny settle tap
  }
  return 0;
}
const IMPACTS = [0.5, 0.76]; // p-values where the ball touches the floor

function resolveAsset(src: string | undefined): string | undefined {
  if (!src) return undefined;
  if (/^(data:|blob:)/i.test(src)) return src;
  if (/^https?:/i.test(src)) return proxyExternalImg(src);
  return staticFile(src.replace(/^\//, ""));
}

const CONFETTI = [
  "#FF5E5B",
  "#FFD93D",
  "#6BCB77",
  "#4D96FF",
  "#A66CFF",
  "#FF9F45",
  "#ffffff",
];

function Confetti({
  frame,
  cx,
  cy,
  accent,
}: {
  frame: number;
  cx: number;
  cy: number;
  accent: string;
}) {
  const t = frame - BURST;
  if (t < 0) return null;
  const count = 90;
  const gravity = 0.55;
  const life = 80;
  const palette = [...CONFETTI, accent];

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = rand(i, 1) * Math.PI * 2;
        const speed = 8 + rand(i, 2) * 21;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 7; // bias the blast upward
        const x = cx + vx * t;
        const y = cy + vy * t + 0.5 * gravity * t * t;
        const op = interpolate(t, [0, 6, life - 22, life], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        if (op <= 0) return null;
        const size = 9 + rand(i, 3) * 13;
        const isRect = rand(i, 6) > 0.4;
        const rot = rand(i, 4) * 360 + t * (4 + rand(i, 5) * 12);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: isRect ? size * 0.5 : size,
              background: palette[i % palette.length],
              borderRadius: isRect ? 2 : "50%",
              opacity: op,
              transform: `translate(-50%, -50%) rotate(${rot}deg)`,
              willChange: "transform, opacity",
            }}
          />
        );
      })}
    </>
  );
}

/** Expanding ring on floor impact — a flat stroked ellipse that rings out. */
function Ripple({
  frame,
  start,
  cx,
  y,
  maxR,
  color,
}: {
  frame: number;
  start: number;
  cx: number;
  y: number;
  maxR: number;
  color: string;
}) {
  const t = frame - start;
  if (t < 0 || t > 24) return null;
  const k = t / 24;
  const radius = maxR * easeOutCubic(k);
  const op = (1 - k) * 0.45;
  return (
    <div
      style={{
        position: "absolute",
        left: cx,
        top: y,
        width: radius * 2,
        height: radius * 0.62, // squashed for floor perspective
        transform: "translate(-50%, -50%)",
        border: `${Math.max(1.5, maxR * 0.012)}px solid ${color}`,
        borderRadius: "50%",
        opacity: op,
      }}
    />
  );
}

export const CardReveal: React.FC<CardRevealProps> = ({
  image,
  caption,
  clipStyle,
}) => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();
  const width = 1920;
  const height = 1080;

  const s = resolveClipStyle(clipStyle, {
    background: "#0E0E12",
    color: "#ffffff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    accent: "#4D96FF",
  });

  const cx = width / 2;
  const unit = Math.min(width, height);
  const ballD = unit * 0.2;
  // Morph target is a SQUARE with soft corners (circle → square).
  const cardW = unit * 0.44;
  const cardH = cardW;
  const cardR = unit * 0.05;

  // The floor line everything sits on; the object grows UPWARD off it so it
  // reads as physically resting on the ground.
  const groundY = height * 0.62;

  // ── Drop + bounce (real gravity, one clean bounce). ──────────────────────────
  const p = clamp01(frame / DROP_END);
  const fallSpan = groundY; // start above the top edge
  const heightAbove = frame < DROP_END ? fallSpan * dropHeight(p) : 0;
  const proximity = 1 - clamp01(heightAbove / (fallSpan * 0.95)); // 0 high → 1 grounded

  // Squash/stretch at each floor contact.
  let impact = 0;
  if (frame < DROP_END) {
    for (const im of IMPACTS) {
      impact = Math.max(impact, Math.exp(-((p - im) ** 2) / 0.0009));
    }
  }

  // ── Morph: gather (anticipation) → spring open into the square. ──────────────
  const mSpring = spring({
    frame: frame - MORPH_START,
    fps,
    config: { damping: 12, stiffness: 120, mass: 0.9 },
    durationInFrames: MORPH_END - MORPH_START,
  });
  const m = Math.max(0, mSpring); // allow slight overshoot past 1 for jelly
  const gather = interpolate(
    frame,
    [MORPH_START - 10, MORPH_START, MORPH_START + 7],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const w = lerp(ballD, cardW, Math.min(m, 1.12));
  const h = lerp(ballD, cardH, Math.min(m, 1.12));
  const r = lerp(ballD / 2, cardR, clamp01(m));

  // Combined squash: floor impacts during the drop + the morph gather.
  const sx = (1 + 0.26 * impact) * (1 + 0.1 * gather);
  const sy = (1 - 0.3 * impact) * (1 - 0.12 * gather);

  // Object center, anchored so its bottom stays on the floor as it grows.
  const float = frame > DROP_END ? Math.sin((frame - DROP_END) / 46) * 4 : 0;
  const centerY = groundY - h / 2 - heightAbove + float;

  // ── Flip: wind back, then swing through with overshoot. ──────────────────────
  const flip = spring({
    frame: frame - FLIP_START,
    fps,
    config: { damping: 13, stiffness: 85, mass: 1 },
    durationInFrames: FLIP_END - FLIP_START,
  });
  const windup = interpolate(
    frame,
    [FLIP_START, FLIP_START + 9, FLIP_START + 21],
    [0, 17, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const angle = flip * 180 - windup;

  const flipProg = clamp01((frame - FLIP_START) / (FLIP_END - FLIP_START));
  const bulge = 1 + 0.05 * Math.sin(flipProg * Math.PI); // subtle mid-flip swell
  const settle = spring({
    frame: frame - FLIP_END,
    fps,
    config: { damping: 9, stiffness: 140, mass: 0.8 },
  });
  const popScale = bulge * (frame >= FLIP_END ? lerp(0.975, 1, settle) : 1);

  // ── Accent focus-frame snapping in on reveal. ────────────────────────────────
  const frameIn = interpolate(frame, [FLIP_END - 8, FLIP_END + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SMOOTH,
  });
  const framePad = unit * 0.022;
  const frameScale = lerp(1.14, 1, frameIn);

  // ── Caption. ──────────────────────────────────────────────────────────────────
  const capIn = interpolate(frame, [CAP_START, CAP_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SMOOTH,
  });

  // ── Contact shadow geometry. ─────────────────────────────────────────────────
  const shadowW = w * lerp(1.55, 1.04, proximity);
  const shadowOpacity = lerp(0.05, 0.26, proximity);

  const resolved = resolveAsset(image);
  const faceShadow = "0 18px 40px rgba(0,0,0,0.32)";

  // 2D flip: squeeze the card horizontally to ~0 at the midpoint and swap the
  // visible face there. We deliberately AVOID a 3D flip (rotateY + preserve-3d
  // + backface-visibility): the in-browser / web-renderer export rasterizes
  // each frame from the DOM and does NOT support 3D transforms, so the image
  // face never painted and the card exported blank white. A scaleX flip looks
  // the same and rasterizes correctly in every export path.
  const angleRad = (angle * Math.PI) / 180;
  const flipScaleX = Math.max(0.001, Math.abs(Math.cos(angleRad)));
  const showFront = Math.cos(angleRad) < 0; // past 90° → image side faces us

  return (
    <FitContent
      designWidth={width}
      designHeight={height}
      background={s.background}
    >
      <AbsoluteFill
        style={{
          fontFamily: s.fontFamily,
          overflow: "hidden",
        }}
      >
        {/* Contact shadow on the floor — tightens + darkens as the ball lands. */}
        <div
          style={{
            position: "absolute",
            left: cx,
            top: groundY,
            width: shadowW,
            height: shadowW * 0.26,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: "#000000",
            opacity: shadowOpacity,
            filter: `blur(${unit * 0.012}px)`,
          }}
        />

        {/* Impact ripples — one per floor contact. */}
        <Ripple
          frame={frame}
          start={Math.round(DROP_END * IMPACTS[0]!)}
          cx={cx}
          y={groundY}
          maxR={ballD * 1.7}
          color={s.accent}
        />
        <Ripple
          frame={frame}
          start={Math.round(DROP_END * IMPACTS[1]!)}
          cx={cx}
          y={groundY}
          maxR={ballD * 1.1}
          color={s.accent}
        />

        {/* Ball → square → flip. One flat element; the flip is a 2D scaleX so it
          rasterizes correctly in every export path. */}
        <div
          style={{
            position: "absolute",
            left: cx,
            top: centerY,
            transform: `translate(-50%, -50%) scaleX(${sx * flipScaleX}) scaleY(${sy})`,
          }}
        >
          <div
            style={{
              width: w,
              height: h,
              borderRadius: r,
              overflow: "hidden",
              background: "#ffffff",
              boxShadow: faceShadow,
              transform: `scale(${popScale})`,
            }}
          >
            {showFront &&
              (resolved ? (
                <Img
                  src={resolved}
                  crossOrigin="anonymous"
                  alt=""
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
                    background: "#e9e9ee",
                    color: "#9aa0aa",
                    fontSize: unit * 0.03,
                    fontWeight: 500,
                  }}
                >
                  Upload an image
                </div>
              ))}
          </div>
        </div>

        {/* Accent focus-frame — snaps around the square on reveal (flat stroke). */}
        {frameIn > 0.01 && (
          <div
            style={{
              position: "absolute",
              left: cx,
              top: centerY,
              width: cardW + framePad * 2,
              height: cardH + framePad * 2,
              transform: `translate(-50%, -50%) scale(${frameScale})`,
              border: `${Math.max(2, unit * 0.004)}px solid ${s.accent}`,
              borderRadius: cardR + framePad,
              opacity: frameIn,
            }}
          />
        )}

        {/* Confetti blast. */}
        <Confetti frame={frame} cx={cx} cy={centerY} accent={s.accent} />

        {/* Caption */}
        {caption.trim() && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: groundY + unit * 0.06,
              textAlign: "center",
              color: s.color,
              fontSize: Math.round(unit * 0.04),
              fontWeight: 600,
              letterSpacing: "-0.01em",
              opacity: capIn,
              transform: `translateY(${(1 - capIn) * 16}px)`,
            }}
          >
            {caption}
          </div>
        )}
      </AbsoluteFill>
    </FitContent>
  );
};
