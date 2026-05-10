"use client";
import { AbsoluteFill, Sequence } from "remotion";
import { componentsById } from "../../components";
import { EffectsWrap } from "../../effects/EffectsWrap";
import type { Project } from "../../project";
import { compositionsById } from "../../registry";

export const ProjectComposition: React.FC<Project> = ({ clips }) => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {clips.map((clip) => {
        const Component = componentsById[clip.compositionId];
        const info = compositionsById[clip.compositionId];
        const from = cursor;
        cursor += clip.durationInFrames;

        // Locked compositions impersonate real apps and ignore universal
        // ClipStyle. Everything else receives the user's per-clip overrides
        // via the `clipStyle` prop.
        const isLocked = info?.brandMode === "locked";
        const styleProps = isLocked ? {} : { clipStyle: clip.style };

        const inner = Component ? (
          <Component {...clip.props} {...styleProps} />
        ) : (
          <MissingClip compositionId={clip.compositionId} />
        );
        return (
          <Sequence
            key={clip.id}
            from={from}
            durationInFrames={clip.durationInFrames}
          >
            <EffectsWrap
              effects={clip.effects}
              clipDurationInFrames={clip.durationInFrames}
            >
              {inner}
            </EffectsWrap>
          </Sequence>
        );
      })}
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
