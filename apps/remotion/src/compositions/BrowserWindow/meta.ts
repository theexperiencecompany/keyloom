import type { CompositionInfo } from "../../schema";
import type { BrowserWindowProps } from "./BrowserWindow";

export const BROWSER_WINDOW_DURATION = 130;
export const BROWSER_WINDOW_FPS = 60;
export const BROWSER_WINDOW_WIDTH = 1920;
export const BROWSER_WINDOW_HEIGHT = 1080;

export const browserWindowDefaultProps: BrowserWindowProps = {
  url: "https://aesthetic.dev",
  pageImageUrl: "",
  pageBackgroundColor: "#fafafa",
};

export const browserWindowInfo: CompositionInfo<BrowserWindowProps> = {
  id: "BrowserWindow",
  title: "Browser Window",
  description:
    "A Mac-style browser frame. The URL types into the address bar, then your page content fades in below.",
  durationInFrames: BROWSER_WINDOW_DURATION,
  fps: BROWSER_WINDOW_FPS,
  width: BROWSER_WINDOW_WIDTH,
  height: BROWSER_WINDOW_HEIGHT,
  defaultProps: browserWindowDefaultProps,
  fields: [
    { kind: "text", key: "url", label: "URL" },
    { kind: "text", key: "pageImageUrl", label: "Page screenshot URL" },
    {
      kind: "text",
      key: "pageBackgroundColor",
      label: "Page background color",
    },
  ],
};
