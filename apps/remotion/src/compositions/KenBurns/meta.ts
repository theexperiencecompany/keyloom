import type { CompositionInfo } from "../../schema";
import type { KenBurnsProps } from "./KenBurns";

// 60fps to match the Studio's projects: the clip plays at the project fps, so
// if this (used by calculateMetadata for the timeline math) didn't match, the
// clip ended up half its intended length and the images flipped twice as fast.
export const KEN_BURNS_FPS = 60;
export const KEN_BURNS_WIDTH = 1080;
export const KEN_BURNS_HEIGHT = 1920;
// Fallback duration when there are no images yet (~3s @ 60fps).
export const KEN_BURNS_DURATION = 180;

export const kenBurnsDefaultProps: KenBurnsProps = {
  images: [
    { name: "Image 1", url: "components/haloai/image.png" },
    { name: "Image 2", url: "components/haloai/image2.png" },
  ],
  // 6s TikTok hook: slideshow (4 displays × 0.6s ≈ 2.4s, smooth crossfade) +
  // prompt screen (3.6s). Keep these in sync with promptSeconds for ~6s total.
  secondsPerImage: 0.6,
  zoom: 0.14,
  loops: 2,
  caption: "Pranking my dad\nSchool HOTDOG was $7 🤤🌭",
  showPrompt: true,
  promptText: "change the hotdog price to $7.32",
  promptSeconds: 3.6,
};

export const kenBurnsInfo: CompositionInfo<KenBurnsProps> = {
  id: "KenBurns",
  category: "media",
  title: "Halo AI",
  description:
    "A zooming photo slideshow with a meme caption, then a prompt/keyboard 'Generating…' hook screen (Halo AI).",
  agentNotes:
    "Halo AI TikTok hook. A zooming 9:16 photo slideshow (images hard-cut, caption strip on top), then a phase-2 screen where the iOS keyboard slides up, a prompt input types out `promptText`, the send button is pressed and a Halo AI 'Generating…' card appears. Supply `images` as { name, url } objects (NOT bare strings); url is a bundled 'components/...'/'images/...' path or a public https URL. `caption` is the white meme strip above the photo (\\n = newline); `promptText` is the typed prompt; `showPrompt` toggles the keyboard phase. Slideshow timing/zoom/loops are fixed defaults (not user-editable). Background fills letterbox gaps via the Style section.",
  durationInFrames: KEN_BURNS_DURATION,
  fps: KEN_BURNS_FPS,
  width: KEN_BURNS_WIDTH,
  height: KEN_BURNS_HEIGHT,
  defaultProps: kenBurnsDefaultProps,
  fields: [
    {
      kind: "imageList",
      key: "images",
      label: "Images",
      itemLabel: "Image",
      max: 12,
    },
    {
      kind: "textarea",
      key: "caption",
      label: "Caption strip (top of photo, blank = none)",
      rows: 2,
    },
    {
      kind: "switch",
      key: "showPrompt",
      label: "Prompt screen after slideshow (keyboard)",
    },
    {
      kind: "text",
      key: "promptText",
      label: "Prompt text",
      placeholder: "change the hotdog price to $7.32",
    },
  ],
  // Grow the video to fit every image (each held for secondsPerImage × loops),
  // plus the optional phase-2 prompt screen. Without this, content past the
  // fallback duration would be cut off.
  calculateMetadata: ({ props }) => {
    const imgs = Array.isArray(props.images)
      ? props.images.filter((i) => Boolean(i?.url))
      : [];
    const per = Math.max(
      1,
      Math.round((props.secondsPerImage ?? 1) * KEN_BURNS_FPS),
    );
    const loops = Math.max(1, Math.round(props.loops ?? 1));
    const slideshow = imgs.length * per * loops;
    const prompt = props.showPrompt
      ? Math.round((props.promptSeconds ?? 3.5) * KEN_BURNS_FPS)
      : 0;
    return {
      durationInFrames: Math.max(per, slideshow + prompt),
    };
  },
};
