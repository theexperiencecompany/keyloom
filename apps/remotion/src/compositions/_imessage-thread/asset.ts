import { staticFile } from "remotion";

/** Resolves a path under public/imessage-thread/, where this scene's fonts, emoji and images live. */
export const threadAsset = (path: string) =>
  staticFile(`imessage-thread/${path}`);

/** Keyloom's shared keyboard tap, used for composer typing. */
export const keyboardSfx = () => staticFile("sounds/keyboard/key.mp3");
