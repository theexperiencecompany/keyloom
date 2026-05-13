"use client";
import { TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { componentsById } from "../../components";
import { EffectsWrap } from "../../effects/EffectsWrap";
import type { Project } from "../../project";
import { compositionsById } from "../../registry";
import { resolveTransition, toPresentation, toTiming } from "../../transitions";

export const ProjectComposition: React.FC<Project> = ({
  clips,
  defaultTransition,
}) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        background: "#000",
        // Headless rendering (CLI + @remotion/web-renderer) rasterizes each
        // frame independently. macOS Chromium's default subpixel-antialiased
        // font smoothing positions glyphs relative to the LCD subpixel grid,
        // so any sub-pixel `transform: translateY()` lands the glyph on a
        // different subpixel each frame → visible wobble in exports.
        // Forcing grayscale AA + geometricPrecision metrics makes glyph
        // rasterization independent of sub-pixel position.
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "geometricPrecision",
      }}
    >
      <TransitionSeries>
        {clips.flatMap((clip, index) => {
          const Component = componentsById[clip.compositionId];
          const info = compositionsById[clip.compositionId];
          const isLocked = info?.brandMode === "locked";
          const styleProps = isLocked ? {} : { clipStyle: clip.style };

          const inner = Component ? (
            <Component key={`c-${clip.id}`} {...clip.props} {...styleProps} />
          ) : (
            <MissingClip
              key={`c-${clip.id}`}
              compositionId={clip.compositionId}
            />
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
    </AbsoluteFill>
  );
};

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
