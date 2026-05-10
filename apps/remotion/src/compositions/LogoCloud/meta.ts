import type { CompositionInfo } from "../../schema";
import type { LogoCloudProps } from "./LogoCloud";

export const LOGO_CLOUD_DURATION = 100;
export const LOGO_CLOUD_FPS = 60;
export const LOGO_CLOUD_WIDTH = 1280;
export const LOGO_CLOUD_HEIGHT = 720;

export const logoCloudDefaultProps: LogoCloudProps = {
  headline: "Trusted by teams at",
  logos: [
    { name: "Vercel", url: "" },
    { name: "Linear", url: "" },
    { name: "Stripe", url: "" },
    { name: "Notion", url: "" },
    { name: "Figma", url: "" },
  ],
  theme: "light",
};

export const logoCloudInfo: CompositionInfo<LogoCloudProps> = {
  id: "LogoCloud",
  title: "Logo Cloud",
  description:
    "A 'trusted by' section with a row of company logos that stagger in.",
  durationInFrames: LOGO_CLOUD_DURATION,
  fps: LOGO_CLOUD_FPS,
  width: LOGO_CLOUD_WIDTH,
  height: LOGO_CLOUD_HEIGHT,
  defaultProps: logoCloudDefaultProps,
  fields: [
    { kind: "text", key: "headline", label: "Headline" },
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
