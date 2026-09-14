"use client";

import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

/**
 * Authentic SF Pro Display — Apple's UI typeface — loaded from local OTF files
 * in `public/sf-pro-display/`. The chat compositions used to lean on the
 * `-apple-system` system stack, which only resolves to real SF on macOS; in a
 * headless export (Linux/Lambda Chromium) it fell back to a generic sans. We
 * load the OTFs so the font travels with the render and the Player + exported
 * MP4 look identical.
 *
 * Loaded at RENDER time via a hook (not at module scope): `staticFile()` only
 * resolves to the correct bundle URL during rendering — calling it at module
 * eval (as `@remotion/fonts`' `loadFont` does) produced a bad `/public/...`
 * path that hung the headless render. The hook also CATCHES load failures and
 * continues the render with the fallback stack, so a font hiccup can never
 * break an export.
 */
export const SF_PRO_FAMILY = "SF Pro Display";

/**
 * Font stack that PREFERS the bundled OTF, then falls back to the live system
 * SF on macOS, then generics + emoji.
 */
export const SF_PRO_STACK = `"${SF_PRO_FAMILY}", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;

const WEIGHTS = [
  { weight: 400, file: "SFPRODISPLAYREGULAR.otf" },
  { weight: 500, file: "SFPRODISPLAYMEDIUM.otf" },
  { weight: 700, file: "SFPRODISPLAYBOLD.otf" },
] as const;

let injected = false;
function injectFontFaces(): void {
  if (typeof document === "undefined" || injected) return;
  injected = true;
  const css = WEIGHTS.map(
    (w) =>
      `@font-face{font-family:"${SF_PRO_FAMILY}";font-style:normal;font-weight:${w.weight};font-display:swap;src:url("${staticFile(
        `sf-pro-display/${w.file}`,
      )}") format("opentype");}`,
  ).join("\n");
  const el = document.createElement("style");
  el.dataset.sfPro = "true";
  el.textContent = css;
  document.head.appendChild(el);
}

/**
 * Inject the SF Pro @font-face rules and block the render until every weight is
 * decoded (so an export never rasterizes a fallback-font frame). On failure it
 * continues anyway with the fallback stack. Call once near the root of a
 * composition that uses {@link SF_PRO_STACK}.
 */
export function useSFProDisplay(): void {
  const [handle] = useState(() => delayRender("load-sf-pro-display"));
  useEffect(() => {
    injectFontFaces();
    Promise.all(
      WEIGHTS.map((w) =>
        document.fonts.load(`${w.weight} 16px "${SF_PRO_FAMILY}"`),
      ),
    )
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
}
