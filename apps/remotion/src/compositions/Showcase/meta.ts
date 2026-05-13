import type { CompositionInfo } from "../../schema";
import type { ShowcaseProps } from "./Showcase";

export const showcaseDefaultProps: ShowcaseProps = {
  eyebrow: "Featured component",
  title: "Built for shipping reels.",
  caption: "Wrap any scene inside a configurable showcase frame.",
  childCompositionId: "BarChart",
  frameStyle: "video",
  backdrop: "dotted",
  backdropImage: "",
  backdropColorA: "#f6f8fa",
  backdropColorB: "#e9ecef",
  innerScale: 0.74,
  cornerRadius: 20,
  shadowIntensity: 0.6,
  borderColor: "#e5e7eb",
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
    "A presentation frame with eyebrow, title, caption, and a configurable backdrop — wraps any other scene inside a video / browser / minimal / floating frame.",
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
      key: "frameStyle",
      label: "Frame style",
      options: [
        { value: "video", label: "Video player" },
        { value: "browser", label: "Browser window" },
        { value: "minimal", label: "Minimal (just rounded)" },
        { value: "floating", label: "Floating (no border)" },
      ],
    },
    {
      kind: "select",
      key: "backdrop",
      label: "Backdrop",
      options: [
        { value: "dotted", label: "Dotted pattern" },
        { value: "grid", label: "Grid pattern" },
        { value: "gradient", label: "Gradient" },
        { value: "image", label: "Image" },
        { value: "solid", label: "Solid (no pattern)" },
      ],
    },
    {
      kind: "image",
      key: "backdropImage",
      label: "Backdrop image",
      placeholder: "Used when Backdrop = Image",
    },
    { kind: "color", key: "backdropColorA", label: "Backdrop color A" },
    { kind: "color", key: "backdropColorB", label: "Backdrop color B" },
    { kind: "color", key: "borderColor", label: "Frame border" },
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
    {
      kind: "number",
      key: "shadowIntensity",
      label: "Shadow intensity (0–1)",
      min: 0,
      max: 1,
    },
  ],
};
