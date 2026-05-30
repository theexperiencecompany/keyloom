import type { Template } from "./types";

/**
 * Tight 10s spot for a single feature tease / social drop. Hook,
 * one-beat reveal, sting close. 300 frames @ 30fps.
 */
export const featureTease10s: Template = {
  id: "feature-tease-10s",
  name: "Feature tease · 10s",
  description:
    "Hook → reveal → sting. Quick social drop or single-feature announcement.",
  whenToUse:
    "User wants a short tease, sting, or social drop (5–12s range). Pick this for 'quick reel', 'social tease', or 'announce a feature in 10 seconds'.",
  fps: 30,
  width: 1920,
  height: 1080,
  slots: [
    {
      id: "hook",
      role: "Hook title",
      category: "text",
      durationInFrames: 75, // 2.5s
      description: "Bold opening — product or feature name. Punchy animation.",
    },
    {
      id: "reveal",
      role: "Reveal beat",
      category: "marketing",
      durationInFrames: 150, // 5s
      description:
        "Feature card / pricing tile / testimonial. The single beat that shows what's new.",
    },
    {
      id: "close",
      role: "Closing sting",
      category: "text",
      durationInFrames: 75, // 2.5s
      description: "Short outro — URL, hashtag, or 'try it now'.",
    },
  ],
  defaultTransition: { kind: "fade", durationInFrames: 6 },
};
