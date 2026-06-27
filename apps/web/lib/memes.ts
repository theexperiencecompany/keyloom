/**
 * Meme template + background registry.
 *
 * Assets are hosted on the Cloudflare CDN, not in `public/` — set the base in
 * `NEXT_PUBLIC_MEME_CDN` (e.g. https://cdn.yoursite.com). Templates are
 * **background-removed** clips (transparent WebM, VP9 `yuva420p`) so the editor
 * just stacks them over a chosen background — no runtime chroma keying.
 *
 * IMPORTANT: the CDN must send CORS headers (`Access-Control-Allow-Origin`)
 * for these files, otherwise the export canvas gets tainted and download fails.
 * The editor already loads every asset with `crossOrigin="anonymous"`.
 */

const CDN = (
  process.env.NEXT_PUBLIC_MEME_CDN ?? "https://cdn.yoursite.com"
).replace(/\/$/, "");

export type MemeTemplate = {
  id: string;
  title: string;
  /** Transparent WebM (VP9 alpha). Absolute CDN URL. */
  src: string;
  width: number;
  height: number;
  /** Whether the clip carries an audio track worth keeping on export. */
  hasAudio?: boolean;
};

export type MemeBackground = {
  id: string;
  title: string;
  /** Absolute CDN URL to a still image. */
  src: string;
};

/** Replace these with your real uploads. ids must be unique + stable. */
export const memeTemplates: MemeTemplate[] = [
  {
    id: "trump-spiderman",
    title: "Trump",
    src: `${CDN}/memes/templates/trump-spiderman.webm`,
    width: 1080,
    height: 1920,
    hasAudio: true,
  },
];

export const memeBackgrounds: MemeBackground[] = [
  {
    id: "office",
    title: "Office",
    src: `${CDN}/memes/backgrounds/office.jpg`,
  },
  {
    id: "city",
    title: "City",
    src: `${CDN}/memes/backgrounds/city.jpg`,
  },
];
