import type { ClipStyle } from "@workspace/compositions/clip-style";
import type { ClipEffect } from "@workspace/compositions/effects/schema";
import type { Project } from "@workspace/compositions/project";
import { compositionsById } from "@workspace/compositions/registry";

export type ParseResult =
  | { ok: true; project: Project; warnings: string[] }
  | { ok: false; error: string };

/**
 * Validates and parses a Project JSON. Performs a structural check (required
 * top-level fields + clip shape) and returns a list of non-fatal warnings for
 * unknown composition ids so callers can surface them.
 */
export function parseProjectJson(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    return { ok: false, error: `Invalid JSON: ${(err as Error).message}` };
  }

  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Project must be a JSON object." };
  }
  const obj = raw as Record<string, unknown>;

  const fps = obj.fps;
  const width = obj.width;
  const height = obj.height;
  const clips = obj.clips;

  if (typeof fps !== "number" || fps <= 0)
    return { ok: false, error: "Missing or invalid `fps`." };
  if (typeof width !== "number" || width <= 0)
    return { ok: false, error: "Missing or invalid `width`." };
  if (typeof height !== "number" || height <= 0)
    return { ok: false, error: "Missing or invalid `height`." };
  if (!Array.isArray(clips))
    return { ok: false, error: "Missing or invalid `clips` array." };

  const warnings: string[] = [];
  const validClips = [];
  for (let i = 0; i < clips.length; i++) {
    const c = clips[i] as Record<string, unknown> | null;
    if (!c || typeof c !== "object") {
      return { ok: false, error: `clips[${i}] is not an object.` };
    }
    if (typeof c.id !== "string" || c.id.length === 0) {
      return { ok: false, error: `clips[${i}].id missing.` };
    }
    if (typeof c.compositionId !== "string") {
      return { ok: false, error: `clips[${i}].compositionId missing.` };
    }
    if (!c.props || typeof c.props !== "object") {
      return { ok: false, error: `clips[${i}].props must be an object.` };
    }
    if (!compositionsById[c.compositionId]) {
      warnings.push(
        `Unknown compositionId "${c.compositionId}" at clips[${i}] — clip kept but will render as Missing scene.`,
      );
    }
    const info = compositionsById[c.compositionId];

    // durationInFrames is optional in JSON. If absent or invalid, fall back
    // to the composition's registered duration so component-level tweaks
    // dictate clip length without re-editing every saved project.
    const explicitDuration =
      typeof c.durationInFrames === "number" && c.durationInFrames > 0
        ? c.durationInFrames
        : null;
    const resolvedDuration = explicitDuration ?? info?.durationInFrames ?? 60;
    const propsObj = c.props as Record<string, unknown>;
    const explicitStyle =
      c.style && typeof c.style === "object"
        ? (c.style as ClipStyle)
        : undefined;

    // Legacy migration: projects saved before the universal ClipStyle change
    // stored these on `clip.props`. Move them onto `clip.style` so the
    // current compositions actually consume them. Locked comps keep their
    // own internal `backgroundColor` prop, so don't migrate those.
    const isLocked = info?.brandMode === "locked";
    let mergedStyle: ClipStyle | undefined = explicitStyle;
    if (!isLocked) {
      const candidates: Array<keyof ClipStyle> = [
        "backgroundColor",
        "textColor",
        "fontFamily",
        "accentColor",
      ];
      for (const key of candidates) {
        const fromProps = propsObj[key];
        if (
          typeof fromProps === "string" &&
          fromProps !== "" &&
          !mergedStyle?.[key]
        ) {
          mergedStyle = { ...(mergedStyle ?? {}), [key]: fromProps };
        }
      }
    }

    validClips.push({
      id: c.id,
      compositionId: c.compositionId,
      durationInFrames: resolvedDuration,
      props: propsObj,
      ...(mergedStyle ? { style: mergedStyle } : {}),
      ...(Array.isArray(c.effects)
        ? { effects: c.effects as ClipEffect[] }
        : {}),
    });
  }

  return {
    ok: true,
    warnings,
    project: { fps, width, height, clips: validClips },
  };
}

export function downloadProject(project: Project, filename = "project.json") {
  const text = JSON.stringify(project, null, 2);
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
