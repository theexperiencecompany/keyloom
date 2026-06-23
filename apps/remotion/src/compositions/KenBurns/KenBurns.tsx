"use client";
import { useLayoutEffect, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { Keyboard } from "../_chat-demo/Keyboard";
import { SF_PRO_STACK, useSFProDisplay } from "../_chat-demo/sf-pro";

/** Natural w/h aspect of an image (blocks the render until measured). */
function useImageAspect(src: string | undefined): number | null {
  const [aspect, setAspect] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!src) {
      setAspect(null);
      return;
    }
    const handle = delayRender(`kb-img-aspect:${src.slice(0, 48)}`);
    const img = new Image();
    img.crossOrigin = "anonymous";
    let done = false;
    const finish = (a: number) => {
      if (done) return;
      done = true;
      setAspect(a);
      continueRender(handle);
    };
    img.onload = () =>
      finish((img.naturalWidth || 1) / (img.naturalHeight || 1));
    img.onerror = () => finish(0.72);
    img.src = src;
    return () => {
      if (!done) {
        done = true;
        continueRender(handle);
      }
    };
  }, [src]);
  return aspect;
}

/**
 * Shape the `imageList` field editor reads/writes: an array of `{ name, url }`
 * (NOT plain strings). `url` is a static path under public/ or an
 * uploaded/pasted data:/http URL.
 */
export type KenBurnsImage = { name: string; url: string };

export type KenBurnsProps = {
  images: KenBurnsImage[];
  /** Seconds each image is held on screen before the hard cut to the next. */
  secondsPerImage?: number;
  /** How small it starts (0.36 = begins at 64%, scales up to full fit). */
  zoom?: number;
  /** How many times to cycle through the whole image set (2 = A→B→A→B). */
  loops?: number;
  /** Meme caption shown as a white strip at the top of the photo (\n = newline).
   *  Empty hides it. */
  caption?: string;
  /** Show the phase-2 "prompt" screen after the slideshow (keyboard + input). */
  showPrompt?: boolean;
  /** Text typed into the prompt input on the phase-2 screen. */
  promptText?: string;
  /** Length (seconds) of the phase-2 prompt screen. */
  promptSeconds?: number;
  clipStyle?: ClipStyle;
};

/** Resolve an image URL: static paths go through staticFile, URLs pass through. */
function resolveSrc(url: string): string {
  return /^(https?:|data:|blob:)/.test(url) ? url : staticFile(url);
}

/** Meme-style caption band that sits ABOVE the photo (white bar, bold text). */
function CaptionStrip({ text, boxW }: { text?: string; boxW: number }) {
  if (!text || !text.trim()) return null;
  return (
    <div
      style={{
        width: "100%",
        background: "#ffffff",
        color: "#3a3a3c",
        textAlign: "center",
        fontWeight: 700,
        fontFamily: SF_PRO_STACK,
        fontSize: Math.round(boxW * 0.052),
        lineHeight: 1.2,
        padding: `${Math.round(boxW * 0.032)}px ${Math.round(boxW * 0.04)}px`,
        whiteSpace: "pre-line",
      }}
    >
      {text}
    </div>
  );
}

/** Send arrow inside the input's circular button. */
function SendArrow({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19V5M12 5l-6 6M12 5l6 6"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Phase 2: after the slideshow the image zooms out a touch more, the background
 * eases from the slideshow color to white, the iOS keyboard slides up from the
 * bottom and a dark prompt input types out `promptText`. All eased.
 */
const PromptScreen: React.FC<{
  item?: KenBurnsImage;
  localP: number;
  fps: number;
  width: number;
  height: number;
  promptText: string;
  caption?: string;
  bg: string;
  startScale: number;
}> = ({
  item,
  localP,
  fps,
  width,
  height,
  promptText,
  caption,
  bg,
  startScale,
}) => {
  // Natural aspect of the shown image → exact contain size so a rounded box
  // hugs the image (rounds the real edges, not the letterbox) at the SAME size
  // as the slideshow.
  const aspect =
    useImageAspect(item ? resolveSrc(item.url) : undefined) ?? 0.72;
  const canvasAspect = width / height;
  const baseW = aspect >= canvasAspect ? width : height * aspect;
  const baseH = aspect >= canvasAspect ? width / aspect : height;

  // Background black→white + image zoom-out, smoothly eased (the zoom-out look
  // the user liked stays as-is).
  const intro = interpolate(localP, [0, 0.7 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  // The image keeps zooming OUT from where the slideshow stopped, and rises into
  // the upper area to make room for the input + keyboard.
  const imgScale = startScale + (0.6 - startScale) * intro;
  const imgY = -0.18 * height * intro;

  // Keyboard glides up quickly but smoothly (ease-out decelerate into place).
  const kbOpen = interpolate(localP, [0.1 * fps, 0.62 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  // Input field eases in with the keyboard.
  const inputIn = interpolate(localP, [0.28 * fps, 0.72 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Type the prompt out once the input + keyboard are settled.
  const typeStart = 0.85 * fps;
  const typeFrames = Math.max(1, promptText.length * 0.045 * fps);
  const typeEnd = typeStart + typeFrames;
  const typed = Math.round(
    interpolate(localP, [typeStart, typeEnd], [0, promptText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const shown = promptText.slice(0, typed);
  // Caret blinks ~ every 0.5s while typing; gone once the prompt is sent.
  const caretOn =
    localP < typeEnd && Math.floor(localP / (0.5 * fps)) % 2 === 0;

  // Once typing finishes: the send button presses, then the image is replaced
  // by the Halo AI "Generating…" card.
  const pressDur = 0.16 * fps;
  const press =
    localP >= typeEnd && localP <= typeEnd + pressDur
      ? Math.sin(((localP - typeEnd) / pressDur) * Math.PI)
      : 0;
  const btnScale = 1 - 0.22 * press;
  const genStart = typeEnd + 0.24 * fps;
  const genIn = interpolate(localP, [genStart, genStart + 0.45 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  // Animated "Generating" dots: 0 → 3, cycling ~0.4s each.
  const dotCount =
    Math.max(0, Math.floor((localP - genStart) / (0.4 * fps))) % 4;
  const genDots = ".".repeat(dotCount);
  const logoSize = Math.round(width * 0.27);

  const fontSize = Math.round(width * 0.039);
  const padX = Math.round(width * 0.05);
  const padTop = Math.round(width * 0.045);
  const padBottom = Math.round(width * 0.038);
  const radius = Math.round(width * 0.045);
  const sideMargin = Math.round(width * 0.035);
  const btn = Math.round(width * 0.066);

  return (
    <AbsoluteFill>
      {/* Slideshow color → white, eased. */}
      <AbsoluteFill style={{ background: bg }} />
      <AbsoluteFill style={{ background: "#ffffff", opacity: intro }} />

      {/* Image keeps zooming out, rising toward the top. A box sized to the
          image's exact contain dimensions carries the rounded corners (so the
          real image edges round, not the letterbox), at the SAME size as the
          slideshow. The rounding eases in with the zoom-out. */}
      {item && (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            // The image gives way to the Halo AI card once the prompt is sent.
            opacity: 1 - genIn,
          }}
        >
          <div
            style={{
              position: "relative",
              width: baseW,
              height: baseH,
              transform: `translateY(${imgY}px) scale(${imgScale})`,
              transformOrigin: "50% 50%",
              willChange: "transform",
              backfaceVisibility: "hidden",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: Math.round(width * 0.04 * intro),
                overflow: "hidden",
              }}
            >
              <Img
                src={resolveSrc(item.url)}
                alt={item.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
            {/* Caption floats above the photo, same as the slideshow, and fades
                out as we enter the keyboard phase — no jump, just a calm fade. */}
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: 0,
                right: 0,
                opacity: 1 - intro,
              }}
            >
              <CaptionStrip text={caption} boxW={baseW} />
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* Halo AI "Generating…" card — fades in where the image was, once the
          prompt is sent. The dots after "Generating" animate. */}
      {genIn > 0 && (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            // Center the card in the white area above the input + keyboard,
            // nudged a little lower.
            paddingBottom: Math.round(height * 0.38),
            opacity: genIn,
            transform: `translateY(${(1 - genIn) * 16}px)`,
            fontFamily: SF_PRO_STACK,
          }}
        >
          <Img
            src={staticFile("components/messagebubble/haloai.png")}
            alt="Halo AI"
            style={{
              width: logoSize,
              height: logoSize,
              borderRadius: Math.round(logoSize * 0.225),
            }}
          />
          <div
            style={{
              marginTop: Math.round(width * 0.03),
              fontSize: Math.round(width * 0.052),
              fontWeight: 700,
              color: "#111114",
            }}
          >
            Halo AI
          </div>
          <div
            style={{
              marginTop: Math.round(width * 0.012),
              fontSize: Math.round(width * 0.036),
              fontWeight: 600,
              color: "#6b6b70",
            }}
          >
            Generating{genDots}
          </div>
        </AbsoluteFill>
      )}

      {/* Input + keyboard pinned to the bottom. */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        {/* Prompt input — dark rounded field with the typed text + a circular
            send button, matching the reference. */}
        <div
          style={{
            margin: `0 ${sideMargin}px ${Math.round(width * 0.03)}px`,
            opacity: inputIn,
            transform: `translateY(${(1 - inputIn) * 28}px)`,
          }}
        >
          <div
            style={{
              position: "relative",
              background: "#262628",
              borderRadius: radius,
              padding: `${padTop}px ${padX}px ${padBottom}px`,
              fontFamily: SF_PRO_STACK,
            }}
          >
            {/* Typed text, top-left, leaving room for the button below-right. */}
            <div
              style={{
                color: "#ffffff",
                fontSize,
                lineHeight: 1.35,
                paddingBottom: Math.round(btn * 0.55),
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {shown}
              <span
                style={{
                  display: "inline-block",
                  width: Math.max(2, Math.round(fontSize * 0.07)),
                  height: Math.round(fontSize * 1.05),
                  marginLeft: 2,
                  transform: "translateY(2px)",
                  background: "#0a84ff",
                  opacity: caretOn ? 1 : 0,
                }}
              />
            </div>
            {/* Circular send button pinned to the bottom-right corner. */}
            <div
              style={{
                position: "absolute",
                right: padX,
                bottom: padBottom,
                width: btn,
                height: btn,
                borderRadius: "50%",
                background: press > 0.05 ? "#3a3a3c" : "#48484a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${btnScale})`,
              }}
            >
              <SendArrow color="#ffffff" size={Math.round(btn * 0.5)} />
            </div>
          </div>
        </div>

        {/* Keyboard: native width scaled uniformly to fill the canvas (keys stay
            symmetric, inner padding untouched). The panel keeps its rounded top
            corners. Slides up from the bottom. */}
        {(() => {
          const KB_PANEL = 434; // KB_W(402) + 2×KB_PAD_X(16): symmetric here
          const KB_NATIVE_H = 296;
          const kbScale = width / KB_PANEL;
          const slotH = KB_NATIVE_H * kbScale;
          return (
            <div
              style={{
                height: slotH,
                position: "relative",
                transform: `translateY(${(1 - kbOpen) * 100}%)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: KB_PANEL,
                  transform: `scale(${kbScale})`,
                  transformOrigin: "bottom left",
                }}
              >
                <Keyboard
                  theme="dark"
                  width={KB_PANEL}
                  fontFamily={SF_PRO_STACK}
                />
              </div>
            </div>
          );
        })()}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * A Ken Burns slideshow on a 9:16 canvas. The camera scales up ONCE over the
 * first pass through the images, so the image cuts A→B WHILE it's still scaling
 * — never after. Then it STOPS and the images keep hard-cutting in place for the
 * remaining `loops`. The zoom tops out below the full canvas size, so the
 * centered image always keeps a margin and never covers the whole screen; the
 * Style background fills the gaps.
 *
 * When `showPrompt` is on, a phase-2 screen follows the slideshow: the image
 * zooms out a bit more, the background eases to white, the iOS keyboard slides
 * up and a dark input types out `promptText`.
 */
export const KenBurns: React.FC<KenBurnsProps> = ({
  images,
  secondsPerImage = 1,
  zoom = 0.12,
  loops = 1,
  caption = "",
  showPrompt = false,
  promptText = "",
  clipStyle,
}) => {
  // Load Apple's SF Pro so the keyboard + input render in the real font (and in
  // headless exports too). No-op for the slideshow-only phase.
  useSFProDisplay();
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = resolveClipStyle(clipStyle, {
    background: "#000000",
    color: "#ffffff",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    accent: "#6366f1",
  });

  // The imageList editor can hand us blank slots; drop anything without a usable
  // url so staticFile() never sees undefined.
  const valid = (Array.isArray(images) ? images : []).filter(
    (item): item is KenBurnsImage => Boolean(item?.url),
  );

  // Displayed (contain) size of the photo so the caption strip can sit at the
  // top of the IMAGE, not the canvas. Measured off the first image — they share
  // the same scene/aspect.
  const slideAspect =
    useImageAspect(valid[0] ? resolveSrc(valid[0].url) : undefined) ?? 0.72;
  const canvasAspect = width / height;
  const slideBaseW = slideAspect >= canvasAspect ? width : height * slideAspect;
  const slideBaseH = slideAspect >= canvasAspect ? width / slideAspect : height;

  const hold = Math.max(1, Math.round(secondsPerImage * fps));
  // The zoom spans the FIRST PASS through every image, so the image always cuts
  // (A→B…) WHILE it's still scaling — never after. With 2 images at 0.5s this
  // is 1s. After this window the zoom is done and holds at full size.
  const zoomFrames = Math.max(1, valid.length * hold);

  // Phase 1 = the slideshow; phase 2 (optional) = the prompt screen after it.
  const slideshowFrames = Math.max(1, valid.length * hold * Math.max(1, loops));
  const inPrompt = showPrompt && frame >= slideshowFrames;

  // Hard cut between images — no crossfade. The two photos are near-identical
  // except their text, so a clean cut reads as just the text changing; a fade
  // would ghost the two together and the differing digits would flicker.
  // %length wraps so each loop replays the images in order.
  const active = valid.length > 0 ? Math.floor(frame / hold) % valid.length : 0;

  // Camera scales up ONCE over that first pass, continuing straight through the
  // cut between images, then STOPS and holds while the images keep swapping.
  // It tops out at END (< 1), NOT the full contain fit, so the image always
  // keeps a margin and never covers the whole screen. Starts `zoom` smaller.
  const END = 0.82;
  // Keep the zoom SUBTLE: the image always starts large (never below START) and
  // only nudges up to END, so the push is gentle and the image swaps stay easy
  // to follow. START is floored so even a big `zoom` value can't make the
  // opening frame tiny — the delta is capped at END - START_FLOOR (~0.1).
  const START_FLOOR = 0.6;
  const start = Math.max(START_FLOOR, END - zoom);
  // Ease in and decelerate into the hold instead of a constant linear push.
  const t = interpolate(frame, [0, zoomFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const scale = start + (END - start) * t;

  return (
    <AbsoluteFill style={{ background: s.background, overflow: "hidden" }}>
      {inPrompt ? (
        <PromptScreen
          item={valid[valid.length - 1]}
          localP={frame - slideshowFrames}
          fps={fps}
          width={width}
          height={height}
          promptText={promptText}
          caption={caption}
          bg={s.background}
          startScale={END}
        />
      ) : (
        valid.map((item, i) => {
          if (i !== active) return null;
          return (
            <AbsoluteFill
              key={`img-${i}`}
              style={{ alignItems: "center", justifyContent: "center" }}
            >
              {/* Photo stays CENTERED; the caption band floats just ABOVE it
                  (absolute, no layout shift) so it never covers the image and
                  the photo's position is identical in the keyboard phase — only
                  the strip fades there, so the transition stays calm. The whole
                  thing scales with the camera zoom. */}
              <div
                style={{
                  position: "relative",
                  width: slideBaseW,
                  height: slideBaseH,
                  transform: `scale(${scale})`,
                  transformOrigin: "50% 50%",
                  // Promote to its own layer so the caption is rasterized ONCE
                  // and GPU-scaled, not re-rasterized each frame (which jitters).
                  willChange: "transform",
                  backfaceVisibility: "hidden",
                }}
              >
                <Img
                  src={resolveSrc(item.url)}
                  alt={item.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    left: 0,
                    right: 0,
                  }}
                >
                  <CaptionStrip text={caption} boxW={slideBaseW} />
                </div>
              </div>
            </AbsoluteFill>
          );
        })
      )}
    </AbsoluteFill>
  );
};
