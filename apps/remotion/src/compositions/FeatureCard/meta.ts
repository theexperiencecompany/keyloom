import type { CompositionInfo } from "../../schema";
import type { FeatureCardProps } from "./FeatureCard";

export const FEATURE_CARD_DURATION = 100;
export const FEATURE_CARD_FPS = 60;
export const FEATURE_CARD_WIDTH = 1280;
export const FEATURE_CARD_HEIGHT = 720;

export const featureCardDefaultProps: FeatureCardProps = {
  icon: "⚡",
  title: "Lightning fast",
  body: "Built for speed. Every interaction takes under 50ms — your users never wait.",
  theme: "light",
};

export const featureCardInfo: CompositionInfo<FeatureCardProps> = {
  id: "FeatureCard",
  title: "Feature Card",
  description:
    "A clean Linear/Vercel-style feature card with icon, title, and body — staggered reveal animation.",
  durationInFrames: FEATURE_CARD_DURATION,
  fps: FEATURE_CARD_FPS,
  width: FEATURE_CARD_WIDTH,
  height: FEATURE_CARD_HEIGHT,
  defaultProps: featureCardDefaultProps,
  fields: [
    { kind: "text", key: "icon", label: "Icon (emoji)" },
    { kind: "text", key: "title", label: "Title" },
    { kind: "textarea", key: "body", label: "Body", rows: 2 },
    {
      kind: "select",
      key: "theme",
      label: "Theme",
      options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ],
    },
  ],
};
