import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { snap } from "../snap";
import { useDesignFrame } from "../use-design-frame";

export const HERO_DEMO_DURATION = 150; // 5s @ 30fps
export const HERO_DEMO_FPS = 30;
export const HERO_DEMO_WIDTH = 1280;
export const HERO_DEMO_HEIGHT = 720;

export const HeroDemo: React.FC = () => {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    from: 0.6,
    to: 1,
    durationInFrames: 30,
  });
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const titleY = interpolate(frame, [25, 50], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOpacity = interpolate(frame, [25, 50], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subtitleY = interpolate(frame, [45, 70], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleOpacity = interpolate(frame, [45, 70], [0, 1], {
    extrapolateRight: "clamp",
  });

  const pills = ["Copy & paste", "Fully typed", "Dark mode", "Accessible"];
  const pillStart = 80;

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 40%, #1a1a2e 0%, #0a0a0a 60%)",
        fontFamily: "Inter, sans-serif",
        color: "white",
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <AbsoluteFill
        style={{ alignItems: "center", justifyContent: "center", gap: 24 }}
      >
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "linear-gradient(135deg, #fff 0%, #888 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 56,
            fontWeight: 800,
            color: "#0a0a0a",
            boxShadow: "0 24px 60px rgba(255,255,255,0.15)",
          }}
        >
          a/u
        </div>

        <div
          style={{
            opacity: titleOpacity,
            transform: `translate3d(0, ${snap(titleY)}px, 0)`,
            fontSize: 80,
            fontWeight: 700,
            letterSpacing: "-0.04em",
          }}
        >
          aesthetic/ui
        </div>

        <div
          style={{
            opacity: subtitleOpacity,
            transform: `translate3d(0, ${snap(subtitleY)}px, 0)`,
            fontSize: 26,
            color: "rgba(255,255,255,0.6)",
            fontWeight: 400,
            letterSpacing: "-0.01em",
          }}
        >
          Beautifully designed components. Copy. Paste. Ship.
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          {pills.map((label, i) => {
            const start = pillStart + i * 8;
            const opacity = interpolate(frame, [start, start + 15], [0, 1], {
              extrapolateRight: "clamp",
            });
            const y = interpolate(frame, [start, start + 15], [16, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={label}
                style={{
                  opacity,
                  transform: `translate3d(0, ${snap(y)}px, 0)`,
                  padding: "10px 18px",
                  borderRadius: 9999,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.04)",
                  fontSize: 16,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(6px)",
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
