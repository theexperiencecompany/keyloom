import type { ClipStyle } from "@workspace/compositions/clip-style";
import type { ClipEffect } from "@workspace/compositions/effects/schema";
import type { Project, ProjectAudio } from "@workspace/compositions/project";
import { compositionsById } from "@workspace/compositions/registry";
import type { SceneTransition } from "@workspace/compositions/transitions";

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
    // `custom:` ids are user-forked components resolved from
    // `customComponents`, not the static registry — don't warn on them.
    if (
      !c.compositionId.startsWith("custom:") &&
      !compositionsById[c.compositionId]
    ) {
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
      ...(c.frame === "phone" || c.frame === "laptop"
        ? { frame: c.frame as "phone" | "laptop" }
        : {}),
      ...(Array.isArray(c.effects)
        ? { effects: c.effects as ClipEffect[] }
        : {}),
    });
  }

  // Optional top-level fields. `defaultTransition` and `audio` survived the
  // earliest project saves untouched, so a missing key just means "no
  // preference"; bad shapes get dropped with a warning rather than failing
  // the whole load.
  const defaultTransition =
    obj.defaultTransition && typeof obj.defaultTransition === "object"
      ? (obj.defaultTransition as SceneTransition)
      : undefined;

  const audio = parseAudio(obj.audio, warnings);
  const customComponents = parseCustomComponents(
    obj.customComponents,
    warnings,
  );

  return {
    ok: true,
    warnings,
    project: {
      fps,
      width,
      height,
      clips: validClips,
      ...(defaultTransition ? { defaultTransition } : {}),
      ...(audio ? { audio } : {}),
      ...(customComponents ? { customComponents } : {}),
    },
  };
}

/**
 * Parse the `customComponents` map (user-forked compositions). Each entry must
 * carry a non-empty `code` string and a `baseId`; malformed entries are
 * dropped with a warning rather than failing the whole load.
 */
function parseCustomComponents(
  raw: unknown,
  warnings: string[],
): Project["customComponents"] | undefined {
  if (!raw) return undefined;
  if (typeof raw !== "object") {
    warnings.push("`customComponents` must be an object — ignored.");
    return undefined;
  }
  const out: NonNullable<Project["customComponents"]> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const v = value as Record<string, unknown> | null;
    if (!v || typeof v !== "object") {
      warnings.push(`customComponents["${id}"] is not an object — dropped.`);
      continue;
    }
    if (typeof v.code !== "string" || v.code.length === 0) {
      warnings.push(`customComponents["${id}"].code missing — dropped.`);
      continue;
    }
    if (typeof v.baseId !== "string" || v.baseId.length === 0) {
      warnings.push(`customComponents["${id}"].baseId missing — dropped.`);
      continue;
    }
    out[id] = {
      baseId: v.baseId,
      name: typeof v.name === "string" ? v.name : v.baseId,
      code: v.code,
      ...(typeof v.exportName === "string" ? { exportName: v.exportName } : {}),
    };
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function parseAudio(raw: unknown, warnings: string[]): ProjectAudio | null {
  if (!raw) return null;
  if (typeof raw !== "object") {
    warnings.push("`audio` must be an object — ignored.");
    return null;
  }
  const a = raw as Record<string, unknown>;
  if (typeof a.src !== "string" || a.src.length === 0) {
    warnings.push("`audio.src` missing — audio not loaded.");
    return null;
  }
  // `blob:` URLs only resolve inside the originating browser session, so
  // a JSON file written by one tab and opened by another will lose its
  // blob audio. Warn loudly — the user can re-upload.
  if (a.src.startsWith("blob:")) {
    warnings.push(
      "`audio.src` is a blob: URL from a previous browser session — re-upload the MP3 to restore audio.",
    );
  }
  const result: ProjectAudio = {
    src: a.src,
    volume:
      typeof a.volume === "number" && Number.isFinite(a.volume)
        ? a.volume
        : 0.2,
  };
  if (typeof a.title === "string") result.title = a.title;
  if (typeof a.attribution === "string") result.attribution = a.attribution;
  if (typeof a.trimStartSec === "number" && a.trimStartSec >= 0) {
    result.trimStartSec = a.trimStartSec;
  }
  if (typeof a.durationFrames === "number" && a.durationFrames > 0) {
    result.durationFrames = a.durationFrames;
  }
  if (typeof a.fadeInFrames === "number" && a.fadeInFrames >= 0) {
    result.fadeInFrames = a.fadeInFrames;
  }
  if (typeof a.fadeOutFrames === "number" && a.fadeOutFrames >= 0) {
    result.fadeOutFrames = a.fadeOutFrames;
  }
  if (typeof a.loop === "boolean") result.loop = a.loop;
  if (typeof a.sourceDurationSec === "number" && a.sourceDurationSec > 0) {
    result.sourceDurationSec = a.sourceDurationSec;
  }
  return result;
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
