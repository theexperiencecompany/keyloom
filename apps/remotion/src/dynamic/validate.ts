import { transform } from "sucrase";

/**
 * Server-safe validation for forked component source. Runs the same sucrase
 * transpile the renderer uses (TS + JSX + import rewrite) so syntax / type
 * errors are caught and reported back — but does NOT execute the code or import
 * the runtime module graph, so it's cheap and safe to call from an API route.
 *
 * Deeper issues (bad imports, runtime errors) surface at render time; this
 * catches the common case (the model wrote code that doesn't parse).
 */
export type ValidationResult = { ok: true } | { ok: false; error: string };

export function validateComponentSource(code: string): ValidationResult {
  if (typeof code !== "string" || code.trim().length === 0) {
    return { ok: false, error: "Component source is empty." };
  }
  try {
    transform(code, {
      transforms: ["typescript", "jsx", "imports"],
      jsxRuntime: "automatic",
      production: true,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  // Light sanity check: a composition must export *something* to render.
  if (!/export\s+(const|function|default|\{)/.test(code)) {
    return { ok: false, error: "No exported component found in the source." };
  }
  return { ok: true };
}
