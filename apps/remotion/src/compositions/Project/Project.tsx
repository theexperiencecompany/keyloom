"use client";
import { Audio as MediaAudio } from "@remotion/media";
import { TransitionSeries } from "@remotion/transitions";
import {
  AbsoluteFill,
  Audio as Html5Audio,
  Sequence,
  useRemotionEnvironment,
  useVideoConfig,
} from "remotion";
import { componentsById } from "../../components";
import { DynamicComposition } from "../../dynamic/DynamicComposition";
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
  customComponents,
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
          // Forked components live in the project's `customComponents` map
          // (keyed by clip.compositionId), not the static registry — they're
          // transpiled from source at render time. They behave like non-locked
          // compositions (receive clipStyle, no curated themes).
          const custom = customComponents?.[clip.compositionId];
          const isCustom = Boolean(custom);

          const Component = componentsById[clip.compositionId];
          const info = compositionsById[clip.compositionId];

          // Optional background-scene backdrop (Inspector → Style → Background
          // → Scene). When a valid scene is set, the clip's own background is
          // forced transparent so the backdrop shows through.
          const backdropId = clip.style?.backgroundScene;
          const BackdropComponent = backdropId
            ? componentsById[backdropId]
            : undefined;
          const backdropInfo = backdropId
            ? compositionsById[backdropId]
            : undefined;
          const hasBackdrop = Boolean(BackdropComponent && backdropInfo);

          // Curated theme — only forward ids the composition actually declares.
          const themeId = clip.style?.theme;
          const themeProps =
            themeId && info?.themes?.some((t) => t.id === themeId)
              ? { clipTheme: themeId }
              : {};

          // The clip's resolved universal style. When a Background Scene is set,
          // the clip's own background goes transparent so the scene shows through.
          const resolvedClipStyle = hasBackdrop
            ? { ...clip.style, backgroundColor: "transparent" }
            : clip.style;
          const contentStyle = { clipStyle: resolvedClipStyle, ...themeProps };

          // Optional device mockup (Inspector → Frame). Render the clip's
          // composition INSIDE PhoneFrame / LaptopFrame. The clip's style rides
          // along via innerProps AND is handed to the frame itself, so the
          // background (color or scene) fills the area AROUND the device too —
          // otherwise the frame paints its own white bg and the clip's
          // background is lost.
          const FrameComp =
            clip.frame === "phone"
              ? componentsById.PhoneFrame
              : clip.frame === "laptop"
                ? componentsById.LaptopFrame
                : null;

          const content = isCustom ? (
            custom ? (
              <DynamicComposition
                key={`c-${clip.id}`}
                code={custom.code}
                exportName={custom.exportName ?? custom.baseId}
                componentProps={{ ...clip.props, ...contentStyle }}
              />
            ) : (
              <MissingClip
                key={`c-${clip.id}`}
                compositionId={clip.compositionId}
              />
            )
          ) : !Component ? (
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
              clipStyle={resolvedClipStyle}
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

          const sequence = (
            <TransitionSeries.Sequence
              key={`seq-${clip.id}`}
              durationInFrames={clip.durationInFrames}
            >
              <EffectsWrap
                effects={clip.effects}
                clipDurationInFrames={clip.durationInFrames}
              >
                {inner}
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
