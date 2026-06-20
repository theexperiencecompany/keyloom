"use client";
import { Audio as MediaAudio } from "@remotion/media";
import { TransitionSeries } from "@remotion/transitions";
import {
  AbsoluteFill,
  Audio as Html5Audio,
  interpolate,
  Sequence,
  useCurrentFrame,
  useRemotionEnvironment,
  useVideoConfig,
} from "remotion";
import { componentsById } from "../../components";
import { EffectsWrap } from "../../effects/EffectsWrap";
import {
  type Project,
  type ProjectAudio,
  projectDuration,
} from "../../project";
import { proxyExternalAudio } from "../../proxy-image";
import { compositionsById } from "../../registry";
import { resolveTransition, toPresentation, toTiming } from "../../transitions";

export const ProjectComposition: React.FC<Project> = ({
  clips,
  defaultTransition,
  audio,
  ...rest
}) => {
  const { width, height } = useVideoConfig();
  const videoDuration = projectDuration({
    clips,
    defaultTransition,
    fps: rest.fps,
    width,
    height,
  });
  return (
    <AbsoluteFill
      style={{
        background: "#000",
        // Grayscale AA stays — it's what kills the subpixel-positioning
        // wobble on text-heavy renders. `textRendering:
        // "geometricPrecision"` was removed because @remotion/web-renderer
        // lowercases it and passes it to Canvas2D's `textRendering` enum,
        // which rejects "geometricprecision" and silently falls back to a
        // path that measures glyphs differently from the HTML render —
        // the result was words inside flex containers (MessagePopup body)
        // rasterizing wider than their CSS boxes and overlapping into
        // siblings ("babe what is" → "babewhatis").
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
    >
      <TransitionSeries>
        {clips.flatMap((clip, index) => {
          const Component = componentsById[clip.compositionId];
          const info = compositionsById[clip.compositionId];
          const isLocked = info?.brandMode === "locked";

          // Optional background-scene backdrop (Inspector → Style → Background
          // → Scene). Locked compositions never receive clipStyle, so they
          // can't carry a backdrop. When a valid scene is set, the clip's own
          // background is forced transparent so the backdrop shows through.
          const backdropId = isLocked ? undefined : clip.style?.backgroundScene;
          const BackdropComponent = backdropId
            ? componentsById[backdropId]
            : undefined;
          const backdropInfo = backdropId
            ? compositionsById[backdropId]
            : undefined;
          const hasBackdrop = Boolean(BackdropComponent && backdropInfo);

          // Curated theme — unlike free-form clipStyle, themes also apply
          // to locked compositions (each theme is a hand-built skin). Only
          // forward ids the composition actually declares.
          const themeId = clip.style?.theme;
          const themeProps =
            themeId && info?.themes?.some((t) => t.id === themeId)
              ? { clipTheme: themeId }
              : {};

          const contentStyle = isLocked
            ? themeProps
            : {
                clipStyle: hasBackdrop
                  ? { ...clip.style, backgroundColor: "transparent" }
                  : clip.style,
                ...themeProps,
              };

          // Optional device mockup (Inspector → Frame). Render the clip's
          // composition INSIDE PhoneFrame / LaptopFrame by feeding it as the
          // frame's inner composition; style/theme ride along via innerProps so
          // the framed clip keeps its look.
          const FrameComp =
            clip.frame === "phone"
              ? componentsById.PhoneFrame
              : clip.frame === "laptop"
                ? componentsById.LaptopFrame
                : null;

          const content = !Component ? (
            <MissingClip
              key={`c-${clip.id}`}
              compositionId={clip.compositionId}
            />
          ) : FrameComp ? (
            <FrameComp
              key={`c-${clip.id}`}
              device="dynamic-island"
              innerCompositionId={clip.compositionId}
              innerProps={{ ...clip.props, ...contentStyle }}
              screenImage=""
            />
          ) : (
            <Component key={`c-${clip.id}`} {...clip.props} {...contentStyle} />
          );

          const inner =
            hasBackdrop && BackdropComponent && backdropInfo ? (
              <AbsoluteFill key={`bg-${clip.id}`}>
                <BackdropComponent
                  {...backdropInfo.defaultProps}
                  clipStyle={{ ...clip.style, backgroundColor: undefined }}
                />
                {content}
              </AbsoluteFill>
            ) : (
              content
            );

          // Camera life — subtle Ken Burns on every non-locked clip.
          // Skipped for brand-locked scenes (authentic apps shouldn't
          // drift) and very short clips (<1s feels jittery, not alive).
          const enableCameraLife = !isLocked && clip.durationInFrames >= 30;

          const sequence = (
            <TransitionSeries.Sequence
              key={`seq-${clip.id}`}
              durationInFrames={clip.durationInFrames}
            >
              <EffectsWrap
                effects={clip.effects}
                clipDurationInFrames={clip.durationInFrames}
              >
                {enableCameraLife ? (
                  <CameraLifeWrap
                    durationInFrames={clip.durationInFrames}
                    clipIndex={index}
                  >
                    {inner}
                  </CameraLifeWrap>
                ) : (
                  inner
                )}
              </EffectsWrap>
            </TransitionSeries.Sequence>
          );

          if (index === 0) {
            return [sequence];
          }

          const t = resolveTransition({
            clipTransition: clip.transition,
            projectDefault: defaultTransition,
            index,
          });

          // Skip transition entirely when duration is 0 or kind is "none" —
          // TransitionSeries handles zero-duration transitions, but emitting
          // them as a hard cut is cleaner.
          if (t.kind === "none" || t.durationInFrames <= 0) {
            return [sequence];
          }

          return [
            <TransitionSeries.Transition
              key={`tx-${clip.id}`}
              timing={toTiming(t)}
              presentation={toPresentation(t, { width, height })}
            />,
            sequence,
          ];
        })}
      </TransitionSeries>

      {audio ? (
        <ProjectAudioTrack audio={audio} videoDuration={videoDuration} />
      ) : null}
    </AbsoluteFill>
  );
};

/**
 * Linear-ramp volume envelope: silent → peak over `fadeInFrames`, hold at
 * peak, then peak → silent over `fadeOutFrames` at the very end of the
 * audio's `durationFrames`. Both ramps respect `peak` so quieter master
 * volumes still fade proportionally.
 */
function audioVolumeAt(
  frame: number,
  audio: ProjectAudio,
  totalFrames: number,
): number {
  const fadeIn = Math.max(0, audio.fadeInFrames ?? 15);
  const fadeOut = Math.max(0, audio.fadeOutFrames ?? 30);
  const peak = Math.max(0, Math.min(1, audio.volume));
  if (totalFrames <= 0) return 0;
  if (fadeIn > 0 && frame < fadeIn) {
    return peak * (frame / fadeIn);
  }
  if (fadeOut > 0 && frame > totalFrames - fadeOut) {
    return peak * Math.max(0, (totalFrames - frame) / fadeOut);
  }
  return peak;
}

function ProjectAudioTrack({
  audio,
  videoDuration,
}: {
  audio: ProjectAudio;
  videoDuration: number;
}) {
  const { fps } = useVideoConfig();
  const environment = useRemotionEnvironment();
  const startFrame = Math.max(
    0,
    Math.min(audio.startFrame ?? 0, Math.max(0, videoDuration - 1)),
  );
  const requestedDuration = audio.durationFrames ?? videoDuration - startFrame;
  // Audio can never outlast the video (clamp from the start offset).
  const audioDuration = Math.max(
    1,
    Math.min(requestedDuration, videoDuration - startFrame),
  );
  const trimBefore = Math.max(0, Math.round((audio.trimStartSec ?? 0) * fps));
  // Route http/https through the same-origin audio proxy so the canvas
  // export stays untainted; blob:/data:/local paths pass through.
  const resolvedSrc = proxyExternalAudio(audio.src);

  return (
    <Sequence from={startFrame} durationInFrames={audioDuration} layout="none">
      {environment.isRendering ? (
        <MediaAudio
          src={resolvedSrc}
          // Skip `trimBefore` worth of frames into the source audio.
          trimBefore={trimBefore}
          loop={audio.loop ?? false}
          // Per-frame volume envelope. The sequence-local frame starts at 0
          // when `startFrame` hits, so fades remain anchored to the audio's
          // own timeline regardless of when it begins in the project.
          volume={(frame) => audioVolumeAt(frame, audio, audioDuration)}
        />
      ) : (
        <Html5Audio
          src={resolvedSrc}
          trimBefore={trimBefore}
          loop={audio.loop ?? false}
          pauseWhenBuffering={false}
          crossOrigin="anonymous"
          volume={(frame) => audioVolumeAt(frame, audio, audioDuration)}
        />
      )}
    </Sequence>
  );
}

function MissingClip({ compositionId }: { compositionId: string }) {
  return (
    <AbsoluteFill
      style={{
        background: "#1a1a1d",
        color: "#fafafa",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "0 80px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.02em" }}>
        Missing scene
      </div>
      <div style={{ fontSize: 22, opacity: 0.6 }}>
        No component registered for id &ldquo;{compositionId}&rdquo;.
      </div>
    </AbsoluteFill>
  );
}

/**
 * Subtle Ken Burns wrapper applied to every non-locked clip. Animates
 * a slow scale (1.00 → 1.05) and a small pan over the clip's full
 * duration so static scenes feel alive without crossing into "look,
 * I'm zooming!" territory. Direction alternates per clip so multiple
 * scenes back-to-back don't drift in the same direction.
 *
 * Caveats:
 *   - Skipped for brand-locked scenes (Tweet, Slack, etc.) — they
 *     should render exactly as the real app does.
 *   - Skipped for very short clips (<1s) where the motion reads as
 *     jitter rather than life.
 *   - Uses `transform-origin: center center` so the pan + scale feel
 *     balanced regardless of clip aspect.
 */
function CameraLifeWrap({
  durationInFrames,
  clipIndex,
  children,
}: {
  durationInFrames: number;
  clipIndex: number;
  children: React.ReactNode;
}) {
  const frame = useCurrentFrame();
  // Alternate direction per clip: even → drift right + down, odd → left + up.
  const dirX = clipIndex % 2 === 0 ? 1 : -1;
  const dirY = clipIndex % 2 === 0 ? 0.4 : -0.4;
  // 5% scale shift, 1% pan shift — both barely perceptible per second
  // but cumulative over the clip.
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.05], {
    extrapolateRight: "clamp",
  });
  const panX = interpolate(frame, [0, durationInFrames], [0, dirX], {
    extrapolateRight: "clamp",
  });
  const panY = interpolate(frame, [0, durationInFrames], [0, dirY], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${panX}%, ${panY}%) scale(${scale})`,
        transformOrigin: "center center",
        willChange: "transform",
      }}
    >
      {children}
    </AbsoluteFill>
  );
}
