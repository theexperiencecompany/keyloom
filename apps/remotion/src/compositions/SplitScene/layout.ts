export type SplitLayout = "stacked" | "side-by-side" | "pip" | "grid-2x2";

export const LAYOUT_SLOT_COUNTS: Record<SplitLayout, number> = {
  stacked: 2,
  "side-by-side": 2,
  pip: 2,
  "grid-2x2": 4,
};
