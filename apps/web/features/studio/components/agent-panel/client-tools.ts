import type { Project } from "@workspace/compositions/project";
import { compositionsById } from "@workspace/compositions/registry";
import type { SceneTransition } from "@workspace/compositions/transitions";
import { parseProjectJson } from "../../lib/project-io";
import type { StudioAction } from "../../state/reducer";

/**
 * Executes the client-side studio tools the agent calls. Returns the result
 * to send back to the model, or `undefined` for tools whose execute lives
 * server-side (those return a result automatically through the stream).
 */
export function runClientTool(
  name: string,
  input: Record<string, unknown>,
  projectRef: React.MutableRefObject<Project>,
  dispatch: React.Dispatch<StudioAction>,
): unknown {
  const project = projectRef.current;

  switch (name) {
    case "buildProject": {
      const projectInput = input.project as unknown;
      if (!projectInput || typeof projectInput !== "object") {
        return { error: "Missing `project` payload." };
      }
      // Reuse the studio's import validator so the agent's JSON has to clear
      // the same bar as a file the user would drag in. Any warnings flow
      // back to the model so it can correct on the next turn if needed.
      const parsed = parseProjectJson(JSON.stringify(projectInput));
      if (!parsed.ok) {
        return { error: parsed.error };
      }
      // Clamp every clip's durationInFrames to its scene's natural
      // animation length. The model often picks longer durations to
      // hit a total runtime, which makes scenes freeze on their last
      // frame for seconds — looks awful. Better to land slightly
      // short than to ship frozen holds.
      const clamped = clampClipDurations(parsed.project);
      dispatch({ type: "LOAD_PROJECT", project: clamped.project });
      return {
        ok: true,
        clipsLoaded: clamped.project.clips.length,
        warnings: [...parsed.warnings, ...clamped.adjustments],
      };
    }
    case "listClips": {
      return {
        clips: project.clips.map((c) => ({
          id: c.id,
          compositionId: c.compositionId,
          durationInFrames: c.durationInFrames,
          props: c.props,
          style: c.style,
        })),
        defaultTransition: project.defaultTransition,
        audio: project.audio,
      };
    }
    case "clearProject": {
      // Delete every clip one by one — reducer doesn't expose a bulk clear,
      // but a chain of DELETE_CLIPs on the captured snapshot is equivalent.
      for (const clip of project.clips) {
        dispatch({ type: "DELETE_CLIP", clipId: clip.id });
      }
      return { ok: true, deletedClips: project.clips.length };
    }
    case "addClip": {
      const compositionId = String(input.compositionId ?? "");
      if (!compositionId) {
        return { error: "compositionId is required" };
      }
      // The reducer mints a UUID for the new clip; we read it back from
      // the next snapshot. dispatch is synchronous in React useReducer, so
      // by the time the next microtask runs the ref will have the new clip
      // at the tail of the array — but we can't await that here. Instead
      // we trust the reducer's appending behavior and return the id by
      // observing the projectRef post-dispatch via a microtask flush.
      const before = project.clips.length;
      dispatch({ type: "ADD_CLIP", compositionId });
      return new Promise<{ clipId?: string; error?: string }>((resolve) => {
        queueMicrotask(() => {
          const next = projectRef.current.clips;
          if (next.length > before) {
            const added = next[next.length - 1];
            resolve({
              clipId: added?.id,
              compositionId: added?.compositionId,
              durationInFrames: added?.durationInFrames,
            } as { clipId?: string });
          } else {
            resolve({ error: `Composition not found: ${compositionId}` });
          }
        });
      });
    }
    case "updateClipProps": {
      const clipId = String(input.clipId ?? "");
      const props = (input.props ?? {}) as Record<string, unknown>;
      if (!clipId) return { error: "clipId is required" };
      dispatch({ type: "UPDATE_CLIP_PROPS", clipId, props });
      return { ok: true };
    }
    case "updateClipStyle": {
      const clipId = String(input.clipId ?? "");
      if (!clipId) return { error: "clipId is required" };
      const patch: Record<string, string> = {};
      for (const k of ["background", "color", "fontFamily", "accent"]) {
        if (typeof input[k] === "string") patch[k] = input[k] as string;
      }
      dispatch({ type: "UPDATE_CLIP_STYLE", clipId, patch });
      return { ok: true };
    }
    case "updateClipDuration": {
      const clipId = String(input.clipId ?? "");
      const durationInFrames = Number(input.durationInFrames ?? 0);
      if (!clipId) return { error: "clipId is required" };
      if (!Number.isFinite(durationInFrames) || durationInFrames < 15) {
        return { error: "durationInFrames must be a number >= 15" };
      }
      dispatch({
        type: "UPDATE_CLIP_DURATION",
        clipId,
        durationInFrames: Math.round(durationInFrames),
      });
      return { ok: true };
    }
    case "deleteClip": {
      const clipId = String(input.clipId ?? "");
      if (!clipId) return { error: "clipId is required" };
      dispatch({ type: "DELETE_CLIP", clipId });
      return { ok: true };
    }
    case "reorderClips": {
      const ids = Array.isArray(input.clipIds)
        ? (input.clipIds as unknown[]).filter(
            (v): v is string => typeof v === "string",
          )
        : [];
      if (ids.length === 0) {
        return { error: "clipIds must be a non-empty array of strings" };
      }
      const known = new Set(project.clips.map((c) => c.id));
      const unknownIds = ids.filter((id) => !known.has(id));
      if (unknownIds.length > 0) {
        return {
          error: `Unknown clipIds in reorder: ${unknownIds.join(", ")}. Call listClips first to get current ids.`,
        };
      }
      const missing = project.clips
        .map((c) => c.id)
        .filter((id) => !ids.includes(id));
      if (missing.length > 0) {
        return {
          error: `clipIds is incomplete — missing existing clips: ${missing.join(", ")}. Pass the full ordering.`,
        };
      }
      dispatch({ type: "REORDER_CLIPS", clipIds: ids });
      return { ok: true, order: ids };
    }
    case "resetClipStyle": {
      const clipId = String(input.clipId ?? "");
      if (!clipId) return { error: "clipId is required" };
      dispatch({ type: "RESET_CLIP_STYLE", clipId });
      return { ok: true };
    }
    case "setProjectTransition": {
      const t = input.transition;
      if (t === null || t === undefined) {
        dispatch({ type: "UPDATE_PROJECT_TRANSITION", transition: undefined });
        return { ok: true, cleared: true };
      }
      if (typeof t !== "object") {
        return { error: "transition must be an object or null" };
      }
      dispatch({
        type: "UPDATE_PROJECT_TRANSITION",
        transition: t as SceneTransition,
      });
      return { ok: true };
    }
    case "setClipTransition": {
      const clipId = String(input.clipId ?? "");
      if (!clipId) return { error: "clipId is required" };
      const t = input.transition;
      if (t === null || t === undefined) {
        dispatch({
          type: "UPDATE_CLIP_TRANSITION",
          clipId,
          transition: undefined,
        });
        return { ok: true, cleared: true };
      }
      if (typeof t !== "object") {
        return { error: "transition must be an object or null" };
      }
      dispatch({
        type: "UPDATE_CLIP_TRANSITION",
        clipId,
        transition: t as SceneTransition,
      });
      return { ok: true };
    }
    case "addEffect": {
      const clipId = String(input.clipId ?? "");
      const effectId = String(input.effectId ?? "");
      if (!clipId) return { error: "clipId is required" };
      if (!effectId) return { error: "effectId is required" };
      const beforeClip = project.clips.find((c) => c.id === clipId);
      if (!beforeClip) return { error: `Unknown clipId: ${clipId}` };
      const beforeCount = beforeClip.effects?.length ?? 0;
      dispatch({ type: "ADD_EFFECT", clipId, effectId });
      return new Promise<{ effectInstanceId?: string; error?: string }>(
        (resolve) => {
          queueMicrotask(() => {
            const next = projectRef.current.clips.find((c) => c.id === clipId);
            const added = next?.effects?.[(next.effects?.length ?? 0) - 1];
            if (next && (next.effects?.length ?? 0) > beforeCount && added) {
              resolve({
                effectInstanceId: added.id,
                effectId: added.effectId,
              } as { effectInstanceId?: string });
            } else {
              resolve({ error: `Effect not registered: ${effectId}` });
            }
          });
        },
      );
    }
    case "updateEffectProps": {
      const clipId = String(input.clipId ?? "");
      const effectInstanceId = String(input.effectInstanceId ?? "");
      const props = (input.props ?? {}) as Record<string, unknown>;
      if (!clipId) return { error: "clipId is required" };
      if (!effectInstanceId) return { error: "effectInstanceId is required" };
      dispatch({
        type: "UPDATE_EFFECT_PROPS",
        clipId,
        effectInstanceId,
        props,
      });
      return { ok: true };
    }
    case "removeEffect": {
      const clipId = String(input.clipId ?? "");
      const effectInstanceId = String(input.effectInstanceId ?? "");
      if (!clipId) return { error: "clipId is required" };
      if (!effectInstanceId) return { error: "effectInstanceId is required" };
      dispatch({
        type: "REMOVE_EFFECT",
        clipId,
        effectInstanceId,
      });
      return { ok: true };
    }
    // Server-executed tools (listScenesInCategory, getSceneDetails,
    // listEffects, listDesignTokens) come through onToolCall too, but
    // their result is already produced upstream — returning undefined
    // tells the caller to skip addToolResult.
    default:
      return undefined;
  }
}

/**
 * Clamp every clip's durationInFrames to its scene's natural animation
 * length (its registry `durationInFrames` default). Stretching past
 * that point just freezes the animation's final frame — the agent does
 * this when it's trying to hit a runtime target, and it looks broken.
 *
 * A small upward tolerance (1.2×) is allowed for scenes that loop or
 * hold gracefully (Terminal, marquees, charts). Anything above that
 * gets pulled back down.
 */
function clampClipDurations(project: Project): {
  project: Project;
  adjustments: string[];
} {
  const TOLERANCE = 1.2;
  const adjustments: string[] = [];
  const next: Project = {
    ...project,
    clips: project.clips.map((clip) => {
      const info = compositionsById[clip.compositionId];
      if (!info) return clip;
      const max = Math.round(info.durationInFrames * TOLERANCE);
      if (clip.durationInFrames <= max) return clip;
      adjustments.push(
        `Clamped ${clip.compositionId} from ${clip.durationInFrames}f to ${max}f (animation would have frozen otherwise).`,
      );
      return { ...clip, durationInFrames: max };
    }),
  };
  return { project: next, adjustments };
}
