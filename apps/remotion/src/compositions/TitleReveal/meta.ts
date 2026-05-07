import type { CompositionInfo } from "../../schema";
import type { TitleRevealProps } from "./TitleReveal";

export const TITLE_REVEAL_DURATION = 240;
export const TITLE_REVEAL_FPS = 60;
export const TITLE_REVEAL_WIDTH = 1920;
export const TITLE_REVEAL_HEIGHT = 1080;

export const titleRevealDefaultProps: TitleRevealProps = {
  headline: "Designed in California",
  subtitle: "Assembled with care",
  backgroundColor: "#ffffff",
  textColor: "#0f1014",
};

export const titleRevealInfo: CompositionInfo<TitleRevealProps> = {
  id: "TitleReveal",
  title: "Title Reveal",
  description:
    "An Apple-style intro: a bold headline that rises from a baseline word-by-word, with an optional subtitle that fades in below.",
  durationInFrames: TITLE_REVEAL_DURATION,
  fps: TITLE_REVEAL_FPS,
  width: TITLE_REVEAL_WIDTH,
  height: TITLE_REVEAL_HEIGHT,
  defaultProps: titleRevealDefaultProps,
  fields: [
    { kind: "textarea", key: "headline", label: "Headline", rows: 2 },
    { kind: "textarea", key: "subtitle", label: "Subtitle (optional)", rows: 2 },
    { kind: "text", key: "backgroundColor", label: "Background color" },
    { kind: "text", key: "textColor", label: "Text color" },
  ],
};
