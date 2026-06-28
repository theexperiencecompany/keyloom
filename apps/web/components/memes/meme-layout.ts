/**
 * Geometry + defaults for the meme composition. Memes always render 9:16 at this
 * resolution; the Stage is authored here and CSS-scaled to fit the screen.
 */

export const OUTPUT_WIDTH = 1080;
export const OUTPUT_HEIGHT = 1920;
export const EXPORT_FPS = 30;

// TikTok/IG cover the bottom ~quarter of the frame with the username, caption,
// and the like/comment/share buttons. Keep the subject (and its face) above that
// band so the platform UI never hides it.
const SAFE_BOTTOM = OUTPUT_HEIGHT * 0.24;

export type NodeAttrs = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
};

export type TextAttrs = NodeAttrs & { width: number };

export type Caption = {
  text: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  color: string;
  stroke: number;
};

export type Selected = "video" | "text" | null;

/** object-fit: cover crop rect for a background image into the 9:16 frame. */
export function coverCrop(img: HTMLImageElement) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const ar = iw / ih;
  const bar = OUTPUT_WIDTH / OUTPUT_HEIGHT;
  let cw: number;
  let ch: number;
  if (ar > bar) {
    ch = ih;
    cw = ih * bar;
  } else {
    cw = iw;
    ch = iw / bar;
  }
  return { x: (iw - cw) / 2, y: (ih - ch) / 2, width: cw, height: ch };
}

/**
 * Default subject framing for a TikTok/IG meme: fill the full width and sit just
 * above the bottom safe band (classic green-screen layout — subject low, but not
 * so low the platform UI hides it; background + caption fill the top). Falls back
 * to fit-height if filling the width would overflow the safe area.
 */
export function defaultVideoFraming(w: number, h: number): NodeAttrs {
  const maxH = OUTPUT_HEIGHT - SAFE_BOTTOM;
  let scale = OUTPUT_WIDTH / w;
  if (h * scale > maxH) scale = maxH / h;
  const dh = h * scale;
  return {
    x: (OUTPUT_WIDTH - w * scale) / 2,
    y: maxH - dh, // bottom of the subject rests on the safe line
    scaleX: scale,
    scaleY: scale,
    rotation: 0,
  };
}

// Caption sits in the upper "safe zone" — clear of TikTok/IG's top status bar
// and their bottom caption/buttons — wide and centered for readability.
export const DEFAULT_TEXT_ATTRS: TextAttrs = {
  x: OUTPUT_WIDTH * 0.06,
  y: OUTPUT_HEIGHT * 0.12,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  width: OUTPUT_WIDTH * 0.88,
};

export const DEFAULT_CAPTION: Caption = {
  text: "when the code works and i'm about to find out why",
  fontFamily: "TikTok Sans",
  fontWeight: 800,
  fontSize: 72,
  color: "#ffffff",
  stroke: 9,
};
