import type { CompositionInfo } from "../../schema";
import type { PricingCardProps } from "./PricingCard";

export const PRICING_CARD_DURATION = 130;
export const PRICING_CARD_FPS = 60;
export const PRICING_CARD_WIDTH = 1280;
export const PRICING_CARD_HEIGHT = 720;

export const pricingCardDefaultProps: PricingCardProps = {
  tier: "Pro",
  price: "$24",
  period: "/ month",
  features:
    "Unlimited projects\nUnlimited renders\n4K exports\nPriority support\nCustom branding",
  cta: "Start free trial",
  highlighted: "yes",
  theme: "light",
};

export const pricingCardInfo: CompositionInfo<PricingCardProps> = {
  id: "PricingCard",
  title: "Pricing Card",
  description:
    "A pricing tier card with title, big price, feature list with checkmarks, and CTA — supports a 'most popular' highlighted variant.",
  durationInFrames: PRICING_CARD_DURATION,
  fps: PRICING_CARD_FPS,
  width: PRICING_CARD_WIDTH,
  height: PRICING_CARD_HEIGHT,
  defaultProps: pricingCardDefaultProps,
  fields: [
    { kind: "text", key: "tier", label: "Tier name" },
    { kind: "text", key: "price", label: "Price" },
    { kind: "text", key: "period", label: "Period (e.g. / month)" },
    {
      kind: "textarea",
      key: "features",
      label: "Features (one per line)",
      rows: 6,
    },
    { kind: "text", key: "cta", label: "CTA label" },
    {
      kind: "select",
      key: "highlighted",
      label: "Highlighted",
      options: [
        { value: "yes", label: "Yes — most popular" },
        { value: "no", label: "No" },
      ],
    },
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
