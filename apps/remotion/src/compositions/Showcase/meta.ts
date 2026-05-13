import type { CompositionInfo } from "../../schema";
import type { ShowcaseProps } from "./Showcase";

export const showcaseDefaultProps: ShowcaseProps = {
  eyebrow: "Live preview",
  title: "Built for shipping reels.",
  caption: "Drop any scene inside the frame to feature it.",
  childCompositionId: "BarChart",
  backdrop: "gradient",
  cornerRadius: 18,
  innerScale: 0.78,
};

const COMPOSITION_EXCLUDES = [
  "Showcase",
  "PhoneFrame",
  "LaptopFrame",
  "SplitScene",
];

export const showcaseInfo: CompositionInfo<ShowcaseProps> = {
  id: "Showcase",
  title: "Showcase Frame",
  description:
    "A presentation frame with eyebrow, title, caption, and a styled backdrop — wraps any other composition for hero-style component showcases.",
  durationInFrames: 240,
  fps: 60,
  width: 1920,
  height: 1080,
  defaultProps: showcaseDefaultProps,
  fields: [
    { kind: "text", key: "eyebrow", label: "Eyebrow" },
    { kind: "text", key: "title", label: "Title" },
    { kind: "textarea", key: "caption", label: "Caption", rows: 2 },
    {
      kind: "composition",
      key: "childCompositionId",
      label: "Showcased component",
      exclude: COMPOSITION_EXCLUDES,
    },
    {
      kind: "select",
      key: "backdrop",
      label: "Backdrop",
      options: [
        { value: "gradient", label: "Gradient" },
        { value: "radial", label: "Radial glow" },
        { value: "grid", label: "Dotted grid" },
        { value: "solid", label: "Solid" },
      ],
    },
    {
      kind: "number",
      key: "cornerRadius",
      label: "Frame radius",
      min: 0,
      max: 80,
    },
    {
      kind: "number",
      key: "innerScale",
      label: "Frame size (0–1)",
      min: 0.3,
      max: 1,
    },
  ],
};
