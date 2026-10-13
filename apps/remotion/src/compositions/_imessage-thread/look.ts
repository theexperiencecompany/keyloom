// The scene's two hand-built skins, selected through the composition's curated themes.
export type Look = "ios26" | "ios18";

/** Maps the forwarded `clipTheme` id to a look; anything but "ios18" is the default iOS 26 look. */
export const lookFromTheme = (clipTheme?: string): Look =>
  clipTheme === "ios18" ? "ios18" : "ios26";

/** Standard iOS light-mode received bubble, shared by both looks (bubbles, typing dots, link cards, iOS 18 tapbacks). */
export const RECEIVED_GREY = "#E9E9EB";

// iOS 26 "Liquid Glass" palette, from the iPhone 13 mini reference SVG.
export const IOS26_BLUE = "#0088FF";
export const IOS26_ICON = "#404040";
export const IOS26_PLACEHOLDER = "#CCCCCC";

/**
 * iOS 26 Liquid Glass control on a white thread: a cool white-to-grey body with a
 * top specular sheen, a hairline edge, a bright inner top highlight, and a tight
 * contact shadow under a wide ambient one. Blur is progressive enhancement.
 */
export const glass = () => ({
  background: [
    "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 55%)",
    "linear-gradient(180deg, rgba(252,252,254,0.94) 0%, rgba(241,242,246,0.94) 100%)",
  ].join(", "),
  boxShadow: [
    "0 0 0 0.5px rgba(0,0,0,0.1)",
    "inset 0 1px 0.5px rgba(255,255,255,0.95)",
    "inset 0 -1px 1px rgba(255,255,255,0.7)",
    "0 1px 2px rgba(0,0,0,0.07)",
    "0 6px 22px rgba(0,0,0,0.09)",
  ].join(", "),
  backdropFilter: "blur(40px)",
});
