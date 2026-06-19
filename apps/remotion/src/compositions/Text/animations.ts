// Plain-data list of the Text composition's animation variants. Kept free of
// any component imports so `meta.ts` (and therefore the registry) can use it for
// the select field WITHOUT dragging the 28 animation components into the
// metadata graph. Text.tsx maps these same `value`s to the actual components.
export type TextAnimation = { value: string; label: string };

export const TEXT_ANIMATIONS: TextAnimation[] = [
  { value: "fade", label: "Fade in" },
  { value: "slide-up", label: "Slide up" },
  { value: "pop", label: "Pop in" },
  { value: "spring", label: "Spring pop" },
  { value: "typewriter", label: "Typewriter" },
  { value: "typewriter-mono", label: "Typewriter (mono)" },
  { value: "soft-blur", label: "Soft blur in" },
  { value: "blur-out", label: "Blur rise" },
  { value: "focus-pull", label: "Focus pull" },
  { value: "shimmer", label: "Shimmer sweep" },
  { value: "settle", label: "Settle in" },
  { value: "scale-fade", label: "Scale fade" },
  { value: "fade-through", label: "Fade through" },
  { value: "line-reveal", label: "Line reveal" },
  { value: "line-slide", label: "Line slide" },
  { value: "char-rise", label: "Character rise" },
  { value: "word-crossfade", label: "Word crossfade" },
  { value: "stagger-center", label: "Stagger from center" },
  { value: "stagger-edges", label: "Stagger from edges" },
  { value: "letters-rise", label: "Letters rise" },
  { value: "letters-drop", label: "Letters drop" },
  { value: "depth-parallax", label: "Word parallax" },
  { value: "kinetic-center", label: "Kinetic center build" },
  { value: "slide-down", label: "Slide down stack" },
  { value: "slide-right", label: "Slide right reveal" },
  { value: "shared-axis-x", label: "Shared axis X" },
  { value: "shared-axis-y", label: "Shared axis Y" },
  { value: "shared-axis-z", label: "Shared axis Z" },
];
