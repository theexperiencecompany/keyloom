// Plain-data list of the Text composition's animation variants. Kept free of
// any component imports so `meta.ts` (and therefore the registry) can use it for
// the select field WITHOUT dragging the animation components into the
// metadata graph. Text.tsx maps these same `value`s to the actual components.
export type TextAnimation = { value: string; label: string };

export const TEXT_ANIMATIONS: TextAnimation[] = [
  { value: "soft-blur", label: "Soft blur in" },
  { value: "typewriter", label: "Typewriter" },
  { value: "letters-rise", label: "Letters rise" },
  { value: "kinetic-center", label: "Kinetic center build" },
  { value: "shimmer", label: "Shimmer sweep" },
];
