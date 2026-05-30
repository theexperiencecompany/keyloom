import type { Template } from "./types";

/**
 * Longer tutorial / "how to" walkthrough: title, context, four
 * concrete demo steps, result, CTA. 900 frames @ 30fps = 30s.
 */
export const tutorial30s: Template = {
  id: "tutorial-30s",
  name: "Tutorial · 30s",
  description:
    "Title → context → four demo steps → result → CTA. Step-by-step walkthrough of a product or workflow.",
  whenToUse:
    "User wants a tutorial, how-to, walkthrough, or step-by-step explainer (~25–35s). Pick this when the brief includes 'show how to', 'walk through', 'explain', 'tutorial'.",
  fps: 30,
  width: 1920,
  height: 1080,
  slots: [
    {
      id: "title",
      role: "Title card",
      category: "text",
      durationInFrames: 90, // 3s
      description: "Tutorial title — 'How to X' or feature name.",
    },
    {
      id: "context",
      role: "Context line",
      category: "text",
      durationInFrames: 60, // 2s
      description: "One-line setup explaining what we'll build/show.",
    },
    {
      id: "step-1",
      role: "Step 1 demo",
      category: "devtools",
      durationInFrames: 150, // 5s
      description: "First concrete step — terminal command or browser action.",
    },
    {
      id: "step-2",
      role: "Step 2 demo",
      category: "devtools",
      durationInFrames: 150, // 5s
      description: "Second step.",
    },
    {
      id: "step-3",
      role: "Step 3 demo",
      category: "devtools",
      durationInFrames: 150, // 5s
      description: "Third step.",
    },
    {
      id: "step-4",
      role: "Step 4 demo",
      category: "devtools",
      durationInFrames: 120, // 4s
      description: "Final step or quick recap.",
    },
    {
      id: "result",
      role: "Result reveal",
      category: "data",
      durationInFrames: 90, // 3s
      description:
        "Chart, stat, or metric card showing the outcome. Marketing card works too if no metric fits.",
    },
    {
      id: "cta",
      role: "Closing CTA",
      category: "text",
      durationInFrames: 90, // 3s
      description: "URL, docs link, or 'try it now'.",
    },
  ],
  defaultTransition: { kind: "fade", durationInFrames: 8 },
};
