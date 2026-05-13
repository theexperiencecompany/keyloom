import type { CompositionInfo } from "../../schema";
import type { PerspectiveMarqueeProps } from "./PerspectiveMarquee";

export const perspectiveMarqueeDefaultProps: PerspectiveMarqueeProps = {
  items: "Vercel, Linear, Stripe, Figma, Notion, Raycast, Arc, Cursor",
  speedPxPerFrame: 2,
  perspective: 1200,
  rotateY: -28,
  rotateX: 8,
  fontSize: 168,
  fontWeight: 700,
  textTransform: "none",
};

export const perspectiveMarqueeInfo: CompositionInfo<PerspectiveMarqueeProps> =
  {
    id: "PerspectiveMarquee",
    title: "Perspective Marquee",
    description:
      "A single tilted row of display type that scrolls toward a vanishing point with per-item depth-of-field blur.",
    durationInFrames: 240,
    fps: 60,
    width: 1920,
    height: 1080,
    defaultProps: perspectiveMarqueeDefaultProps,
    fields: [
      {
        kind: "textarea",
        key: "items",
        label: "Items (comma-separated)",
        rows: 2,
      },
      {
        kind: "number",
        key: "speedPxPerFrame",
        label: "Speed (px/frame)",
        min: 0.25,
        max: 8,
      },
      {
        kind: "number",
        key: "perspective",
        label: "Perspective (px)",
        min: 400,
        max: 3000,
      },
      {
        kind: "number",
        key: "rotateY",
        label: "Tilt Y (deg)",
        min: -60,
        max: 60,
      },
      {
        kind: "number",
        key: "rotateX",
        label: "Tilt X (deg)",
        min: -30,
        max: 30,
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
          { value: "none", label: "As typed" },
          { value: "uppercase", label: "UPPERCASE" },
        ],
      },
    ],
  };
