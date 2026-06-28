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

// By default we serve assets through our same-origin proxy (/api/meme-asset) so
// the export canvas never taints — works even when the CDN sends no CORS headers
// (e.g. the r2.dev managed URL). Once you serve the bucket from a custom domain
// with a CORS policy, set NEXT_PUBLIC_MEME_DIRECT=1 to skip the proxy hop.
const DIRECT = process.env.NEXT_PUBLIC_MEME_DIRECT === "1";

/** Build the URL the browser loads for a meme asset at `path` (no leading /). */
export function memeAsset(path: string): string {
  const direct = `${CDN}/${path.replace(/^\//, "")}`;
  return DIRECT ? direct : `/api/meme-asset?u=${encodeURIComponent(direct)}`;
}

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

/** Replace/extend with your real uploads. ids must be unique + stable. */
export const memeTemplates: MemeTemplate[] = [
  {
    id: "aww",
    title: "Aww",
    src: memeAsset("memes/aww_transparent.webm"),
    // native size of the clip — used only for default framing math; the meme
    // output is always 9:16 (see OUTPUT_WIDTH/HEIGHT in the editor).
    width: 1354,
    height: 1080,
    hasAudio: false,
  },
];

/**
 * Curated backgrounds, served from apps/web/public/backgrounds (shared with the
 * remotion app via symlink). The first entry is the editor's default. Users can
 * still upload their own; ids must be unique + stable.
 */
export const memeBackgrounds: MemeBackground[] = [
  { id: "bg1", title: "Background 1", src: "/backgrounds/bg1.jpg" },
  { id: "bg2", title: "Background 2", src: "/backgrounds/bg2.jpg" },
  { id: "bg3", title: "Background 3", src: "/backgrounds/bg3.jpg" },
];
