import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

/**
 * Lambda's headless Chromium ships with no system fonts — there is no
 * `-apple-system`, no `BlinkMacSystemFont`, no "SF Pro Display", no "Segoe UI".
 * Reference any of those and the text silently falls back to a generic serif,
 * producing the wrong glyphs and frame-to-frame jitter (parallel render tabs
 * disagree on the fallback).
 *
 * So every composition uses these embedded Google Fonts instead. `loadFont()`
 * from `@remotion/google-fonts` registers the `@font-face` AND blocks frame
 * capture (`delayRender`/`continueRender`) until the font is ready — on Lambda
 * and in the browser Studio/preview alike.
 */
const { fontFamily: interFamily } = loadInter();
const { fontFamily: monoFamily } = loadJetBrainsMono();

/** Inter — the Lambda-safe replacement for the Apple/system sans stack. */
export const SANS_FONT = `${interFamily}, sans-serif`;

/** JetBrains Mono — the Lambda-safe replacement for `SF Mono` / `ui-monospace`. */
export const MONO_FONT = `${monoFamily}, monospace`;
