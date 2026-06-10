import type { CompositionInfo } from "../../schema";
import type { BounceCardsProps } from "./BounceCards";

export const BOUNCE_CARDS_DURATION = 210;
export const BOUNCE_CARDS_FPS = 30;
export const BOUNCE_CARDS_WIDTH = 1280;
export const BOUNCE_CARDS_HEIGHT = 720;

export const bounceCardsDefaultProps: BounceCardsProps = {
  images: [
    "images/stickers/sticker_03.webp",
    "images/stickers/sticker_07.webp",
    "images/stickers/sticker_11.webp",
    "images/stickers/sticker_14.webp",
    "images/stickers/sticker_19.webp",
  ],
};

export const bounceCardsInfo: CompositionInfo<BounceCardsProps> = {
  id: "BounceCards",
  category: "media",
  agentNotes:
    "A fanned row of image cards that bounce in with an elastic, staggered spring, then a spotlight cycles through them — each card glides to center, un-rotates and lifts like a hover. Great for showcasing avatars, product shots, stickers, or screenshots. Supply up to 5 images; the card background and spotlight glow come from the Style section.",
  title: "Bounce Cards",
  description:
    "A fan of image cards that springs in elastically and then spotlights each card in turn.",
  durationInFrames: BOUNCE_CARDS_DURATION,
  fps: BOUNCE_CARDS_FPS,
  width: BOUNCE_CARDS_WIDTH,
  height: BOUNCE_CARDS_HEIGHT,
  defaultProps: bounceCardsDefaultProps,
  fields: [
    {
      kind: "imageList",
      key: "images",
      label: "Cards",
      itemLabel: "Card",
      max: 5,
    },
  ],
};
