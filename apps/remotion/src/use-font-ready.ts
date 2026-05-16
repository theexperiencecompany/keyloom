"use client";
import { useEffect, useRef } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";

/**
 * Block frame capture until the requested font family is available in the
 * current document.
 *
 * Remotion renders frames in parallel across multiple browser tabs that
 * don't share state. If a tab captures a frame before its font has
 * loaded, it falls back to a system font and the rasterized glyphs
 * disagree with frames captured by a tab that DID have the font ready —
 * visible as character-level jitter between adjacent frames.
 *
 * This hook calls `delayRender()` on mount with a high handle timeout
 * (load can be slow on a cold render) and only resumes rendering once
 * `document.fonts.load()` resolves or the load truly fails. It is a
 * no-op for the empty / system-only font stack — system fonts are
 * always present so no wait is needed.
 *
 * Pass the same `fontFamily` string you put on `style.fontFamily`; the
 * primary face (first family in the comma list) is the one we load.
 */
export function useFontReady(fontFamily: string): void {
  const handleRef = useRef<number | null>(null);

  useEffect(() => {
    const primary = primaryFamily(fontFamily);
    if (!primary || isSystemFamily(primary)) return;

    if (typeof document === "undefined" || !document.fonts) return;

    const handle = delayRender(`Loading font: ${primary}`, {
      timeoutInMilliseconds: 30000,
    });
    handleRef.current = handle;

    // Headless Remotion renders run in an empty document with no
    // stylesheets — the Studio's <link> tag is only present in the
    // user's browser. Inject the Google Fonts URL ourselves so the
    // family is actually available when document.fonts.load() resolves.
    ensureGoogleFontLink(primary);

    const probe = `400 16px "${primary}"`;
    const probeBold = `700 16px "${primary}"`;
    Promise.all([
      document.fonts.load(probe),
      document.fonts.load(probeBold),
      // `document.fonts.ready` resolves once *all* in-flight font loads
      // settle. Combining that with the explicit probe means we wait
      // both for the family we care about AND any other stylesheet font
      // that might shift layout.
      document.fonts.ready,
    ])
      .then(() => continueRender(handle))
      .catch((err) => {
        cancelRender(
          err instanceof Error
            ? err
            : new Error(`Font load failed for ${primary}`),
        );
      });

    return () => {
      if (handleRef.current !== null) {
        continueRender(handleRef.current);
        handleRef.current = null;
      }
    };
  }, [fontFamily]);
}

function primaryFamily(fontFamily: string): string | null {
  const first = fontFamily.split(",")[0];
  if (!first) return null;
  return first.replace(/['"]/g, "").trim() || null;
}

const SYSTEM_KEYWORDS = new Set([
  "system-ui",
  "-apple-system",
  "blinkmacsystemfont",
  "sans-serif",
  "serif",
  "monospace",
  "cursive",
  "fantasy",
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
  "inherit",
  "initial",
  "unset",
]);

function isSystemFamily(name: string): boolean {
  return SYSTEM_KEYWORDS.has(name.toLowerCase());
}

const injectedLinks = new Set<string>();

function ensureGoogleFontLink(family: string): void {
  if (injectedLinks.has(family)) return;
  injectedLinks.add(family);
  const encoded = encodeURIComponent(family).replace(/%20/g, "+");
  const href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700&display=block`;
  // Avoid double-injection if the host page already added it.
  const existing = document.querySelector<HTMLLinkElement>(
    `link[data-remotion-font="${family}"]`,
  );
  if (existing) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.remotionFont = family;
  document.head.appendChild(link);
}
