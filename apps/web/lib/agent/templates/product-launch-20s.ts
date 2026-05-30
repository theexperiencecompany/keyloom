import type { Template } from "./types";

/**
 * Classic product-launch pacing: hook the viewer, show how the product
 * works, prove it works (social proof / result), call to action. Six
 * slots across 600 frames @ 30fps = exactly 20s before transitions.
 */
export const productLaunch20s: Template = {
  id: "product-launch-20s",
  name: "Product launch · 20s",
  description:
    "Hook → quick context → demo → demo → social proof → CTA. Best for shipping a new product or feature.",
  whenToUse:
    "User wants a launch/announcement video, intro reel, or short demo of a new product. Default for 'make a product launch video'.",
  fps: 30,
  width: 1920,
  height: 1080,
  slots: [
    {
      id: "hook",
      role: "Opening title",
      category: "text",
      durationInFrames: 90, // 3s
      description:
        "Brand name or product name. Short, bold, animates in. Pick a punchy title animation.",
    },
    {
      id: "tagline",
      role: "Tagline / promise",
      category: "text",
      durationInFrames: 60, // 2s
      description:
        "One-line value prop under the hook. Pick a quieter text animation — fade/slide.",
    },
    {
      id: "demo-1",
      role: "First demo beat",
      category: "devtools",
      durationInFrames: 150, // 5s
      description:
        "Show the product in action — terminal command, browser walkthrough, or typing demo.",
    },
    {
      id: "demo-2",
      role: "Second demo beat",
      category: "devtools",
      durationInFrames: 120, // 4s
      description:
        "Continue the demo — second terminal command, or a charts/result reveal works too.",
    },
    {
      id: "proof",
      role: "Social proof / result",
      category: "marketing",
      durationInFrames: 90, // 3s
      description:
        "Toast notification, feature card, or testimonial showing the win.",
    },
    {
      id: "cta",
      role: "Call to action",
      category: "text",
      durationInFrames: 90, // 3s
      description: "Closing CTA — URL, 'try at X', or 'available now'.",
    },
  ],
  defaultTransition: { kind: "fade", durationInFrames: 8 },
};
