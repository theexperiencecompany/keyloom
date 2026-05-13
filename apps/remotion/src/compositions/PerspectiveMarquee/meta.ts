import type { CompositionInfo } from "../../schema";
import type { PerspectiveMarqueeProps } from "./PerspectiveMarquee";

export const PERSPECTIVE_MARQUEE_DURATION = 240;
export const PERSPECTIVE_MARQUEE_FPS = 60;
export const PERSPECTIVE_MARQUEE_WIDTH = 1920;
export const PERSPECTIVE_MARQUEE_HEIGHT = 1080;

export const perspectiveMarqueeDefaultProps: PerspectiveMarqueeProps = {
  text: "MOTION STUDIO",
  rows: 5,
  speed: 4,
  perspective: 800,
  rotateX: 55,
  fontSize: 180,
  fontWeight: 900,
  textTransform: "uppercase",
};

export const perspectiveMarqueeInfo: CompositionInfo<PerspectiveMarqueeProps> =
  {
    id: "PerspectiveMarquee",
    title: "Perspective Marquee",
    description:
      "A 3D-perspective scrolling marquee of giant type — alternating rows ride in opposite directions toward a vanishing point.",
    durationInFrames: PERSPECTIVE_MARQUEE_DURATION,
    fps: PERSPECTIVE_MARQUEE_FPS,
    width: PERSPECTIVE_MARQUEE_WIDTH,
    height: PERSPECTIVE_MARQUEE_HEIGHT,
    defaultProps: perspectiveMarqueeDefaultProps,
    fields: [
      { kind: "text", key: "text", label: "Text" },
      { kind: "number", key: "rows", label: "Rows", min: 1, max: 8 },
      { kind: "number", key: "speed", label: "Speed", min: 1, max: 20 },
      {
        kind: "number",
        key: "perspective",
        label: "Perspective (px)",
        min: 200,
        max: 2000,
      },
      {
        kind: "number",
        key: "rotateX",
        label: "Tilt X (deg)",
        min: 0,
        max: 80,
      },
      {
        kind: "number",
        key: "fontSize",
        label: "Font size",
        min: 60,
        max: 400,
      },
      {
        kind: "number",
        key: "fontWeight",
        label: "Font weight",
        min: 100,
        max: 900,
      },
      {
        kind: "select",
        key: "textTransform",
        label: "Case",
        options: [
          { value: "uppercase", label: "UPPERCASE" },
          { value: "none", label: "As typed" },
        ],
      },
    ],
  };
