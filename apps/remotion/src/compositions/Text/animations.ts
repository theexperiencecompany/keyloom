// Plain-data list of the Text composition's animation variants. Kept free of
// any component imports so `meta.ts` (and therefore the registry) can use it for
// the select field WITHOUT dragging the animation components into the
// metadata graph. Text.tsx maps these same `value`s to the actual components.
//
// `value`s are stable identifiers (old saved clips reference them) — only the
// `label`s are display names, written in plain language describing the motion.
export type TextAnimation = { value: string; label: string };

export const TEXT_ANIMATIONS: TextAnimation[] = [
  { value: "fade", label: "Fade in" },
  { value: "slide-up", label: "Slide up" },
  { value: "pop", label: "Pop in" },
  { value: "spring", label: "Spring pop" },
  { value: "typewriter", label: "Typewriter" },
  { value: "typewriter-mono", label: "Typewriter (mono)" },
  { value: "soft-blur", label: "Soft blur in" },
  { value: "blur-out", label: "Words rise from blur" },
  { value: "focus-pull", label: "Blurry to sharp" },
  { value: "shimmer", label: "Shimmer sweep" },
  { value: "settle", label: "Ease into place" },
  { value: "scale-fade", label: "Zoom in fade" },
  { value: "fade-through", label: "Fade and rise" },
  { value: "line-reveal", label: "Lines wipe up" },
  { value: "line-slide", label: "Lines slide in from left" },
  { value: "char-rise", label: "Letters float up" },
  { value: "word-crossfade", label: "Words fade in one by one" },
  { value: "stagger-center", label: "Letters bloom outward" },
  { value: "stagger-edges", label: "Letters sweep inward" },
  { value: "letters-rise", label: "Letters pop up" },
  { value: "letters-drop", label: "Letters drop" },
  { value: "depth-parallax", label: "Words rush forward" },
  { value: "kinetic-center", label: "Words slide together" },
  { value: "slide-down", label: "Words drop from above" },
  { value: "slide-right", label: "Wipe in from the left" },
  { value: "shared-axis-x", label: "Glide in sideways" },
  { value: "shared-axis-y", label: "Words appear in sequence" },
  { value: "shared-axis-z", label: "Zoom in through blur" },
];
