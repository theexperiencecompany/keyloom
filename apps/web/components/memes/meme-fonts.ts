/**
 * Caption fonts for the meme editor. The display faces are Google Fonts that
 * nail the TikTok/CapCut look (rounded, heavy); `loadMemeFonts` fetches them and
 * actively loads each weight so Konva can draw them on the canvas. The remaining
 * entries are safe system fonts that need no loading.
 */

export const FONTS = [
  { value: "TikTok Sans", label: "TikTok Sans" },
  { value: "Poppins", label: "Poppins" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Anton", label: "Anton" },
  { value: "Bebas Neue", label: "Bebas Neue" },
  { value: "Archivo Black", label: "Archivo Black" },
  { value: "JetBrains Mono", label: "JetBrains Mono" },
  { value: "Impact", label: "Impact" },
  { value: "Arial", label: "Arial" },
  { value: "Inter", label: "Inter" },
  { value: "Comic Sans MS", label: "Comic Sans" },
];

export const WEIGHTS = [
  { value: "400", label: "Normal" },
  { value: "700", label: "Bold" },
  { value: "900", label: "Black" },
];

// Google Fonts to fetch + the weights we render at. Single-weight display faces
// (Anton, Bebas Neue, Archivo Black) only ship 400.
const GOOGLE_FONTS: { family: string; weights: number[] }[] = [
  { family: "TikTok Sans", weights: [400, 700, 800, 900] },
  { family: "Poppins", weights: [400, 700, 800, 900] },
  { family: "Montserrat", weights: [400, 700, 800, 900] },
  { family: "Anton", weights: [400] },
  { family: "Bebas Neue", weights: [400] },
  { family: "Archivo Black", weights: [400] },
  { family: "JetBrains Mono", weights: [400, 700, 800] },
];

const GOOGLE_FONTS_HREF = `https://fonts.googleapis.com/css2?${GOOGLE_FONTS.map(
  (f) => `family=${f.family.replace(/ /g, "+")}:wght@${f.weights.join(";")}`,
).join("&")}&display=swap`;

/**
 * Inject the Google Fonts stylesheet and actively load each weight so they're
 * available to the canvas (a CSS link alone doesn't fetch a font until it's used
 * in the DOM). Resolves once the fonts are ready so the caller can redraw.
 */
export async function loadMemeFonts(): Promise<void> {
  if (typeof document === "undefined") return;
  const id = "meme-google-fonts";
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = GOOGLE_FONTS_HREF;
    document.head.appendChild(link);
  }
  const specs = GOOGLE_FONTS.flatMap((f) =>
    f.weights.map((w) => `${w} 72px '${f.family}'`),
  );
  await Promise.all(specs.map((s) => document.fonts.load(s).catch(() => {})));
}
