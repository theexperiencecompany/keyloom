import type { ClipStyle } from "@workspace/compositions/clip-style";
import { effectsById } from "@workspace/compositions/effects/registry";
import type { ClipEffect } from "@workspace/compositions/effects/schema";
import {
  type Clip,
  type ClipFrame,
  DEFAULT_PROJECT,
  type Project,
  type ProjectAudio,
} from "@workspace/compositions/project";
import { compositionsById } from "@workspace/compositions/registry";
import type { SceneTransition } from "@workspace/compositions/transitions";
import { resolveCompositionMeta } from "@/lib/composition-meta";

export type StudioPanel = "library" | "agent" | "upload" | null;

/**
 * Tagged union for what's currently selected in the studio. The inspector
 * dispatches on `kind` to render the right pane (clip props, audio
 * controls, etc). Null = nothing selected.
 */
export type StudioSelection =
  | { kind: "clip"; id: string }
  | { kind: "audio" }
  | null;

export type StudioState = {
  project: Project;
  selection: StudioSelection;
  openPanel: StudioPanel;
};

export type StudioAction =
  | { type: "ADD_CLIP"; compositionId: string }
  | { type: "DELETE_CLIP"; clipId: string }
  | { type: "REORDER_CLIPS"; clipIds: string[] }
  | {
      type: "UPDATE_CLIP_PROPS";
      clipId: string;
      props: Record<string, unknown>;
    }
  | { type: "UPDATE_CLIP_DURATION"; clipId: string; durationInFrames: number }
  | { type: "ADD_EFFECT"; clipId: string; effectId: string }
  | { type: "REMOVE_EFFECT"; clipId: string; effectInstanceId: string }
  | {
      type: "UPDATE_EFFECT_PROPS";
      clipId: string;
      effectInstanceId: string;
      props: Record<string, unknown>;
    }
  | { type: "SELECT_CLIP"; clipId: string | null }
  | { type: "SELECT_AUDIO" }
  | { type: "CLEAR_SELECTION" }
  | { type: "TOGGLE_PANEL"; panel: StudioPanel }
  | { type: "UPDATE_CLIP_STYLE"; clipId: string; patch: Partial<ClipStyle> }
  | { type: "RESET_CLIP_STYLE"; clipId: string }
  | { type: "SET_CLIP_FRAME"; clipId: string; frame: ClipFrame | null }
  | {
      type: "UPDATE_CLIP_TRANSITION";
      clipId: string;
      transition: SceneTransition | undefined;
    }
  | {
      type: "UPDATE_PROJECT_TRANSITION";
      transition: SceneTransition | undefined;
    }
  | { type: "SET_PROJECT_FORMAT"; width: number; height: number }
  | { type: "SET_PROJECT_NAME"; name: string }
  | { type: "SET_PROJECT_AUDIO"; audio: ProjectAudio }
  | { type: "UPDATE_PROJECT_AUDIO"; patch: Partial<ProjectAudio> }
  | { type: "CLEAR_PROJECT_AUDIO" }
  | { type: "LOAD_PROJECT"; project: Project };

export const initialStudioState: StudioState = {
  project: DEFAULT_PROJECT,
  selection: null,
  openPanel: "library",
};

export function studioReducer(
  state: StudioState,
  action: StudioAction,
): StudioState {
  switch (action.type) {
    case "ADD_CLIP": {
      const info = compositionsById[action.compositionId];
      if (!info) return state;
      const props = structuredClone(info.defaultProps) as Record<
        string,
        unknown
      >;
      // Size the new clip to its CONTENT, not the static fallback: a composition
      // with calculateMetadata (e.g. KenBurns/MessageBubbles) grows its timeline
      // to fit its props, so a fresh clip must start at that resolved length —
      // otherwise it's clamped to the short registry default and the tail
      // (later images / messages) is cut off.
      const { durationInFrames } = resolveCompositionMeta(info, props);
      const clip: Clip = {
        id: makeClipId(),
        compositionId: info.id,
        props,
        durationInFrames,
      };
      return {
        ...state,
        project: { ...state.project, clips: [...state.project.clips, clip] },
        selection: { kind: "clip", id: clip.id },
      };
    }
    case "DELETE_CLIP": {
      const clips = state.project.clips.filter((c) => c.id !== action.clipId);
      const wasSelected =
        state.selection?.kind === "clip" &&
        state.selection.id === action.clipId;
      return {
        ...state,
        project: { ...state.project, clips },
        selection: wasSelected ? null : state.selection,
      };
    }
    case "REORDER_CLIPS": {
      const byId = new Map(state.project.clips.map((c) => [c.id, c]));
      const clips = action.clipIds
        .map((id) => byId.get(id))
        .filter((c): c is Clip => Boolean(c));
      return { ...state, project: { ...state.project, clips } };
    }
    case "UPDATE_CLIP_PROPS": {
      const clips = state.project.clips.map((c) => {
        if (c.id !== action.clipId) return c;
        const info = compositionsById[c.compositionId];
        // Re-fit the clip length to the new props for content-driven
        // compositions (those with calculateMetadata, e.g. KenBurns grows with
        // image count / loops). Static compositions keep their current length
        // so a manual resize isn't clobbered on every edit.
        const durationInFrames = info?.calculateMetadata
          ? resolveCompositionMeta(info, action.props).durationInFrames
          : c.durationInFrames;
        return { ...c, props: action.props, durationInFrames };
      });
      return { ...state, project: { ...state.project, clips } };
    }
    case "UPDATE_CLIP_DURATION": {
      const clips = state.project.clips.map((c) =>
        c.id === action.clipId
          ? { ...c, durationInFrames: Math.max(15, action.durationInFrames) }
          : c,
      );
      return { ...state, project: { ...state.project, clips } };
    }
    case "ADD_EFFECT": {
      const info = effectsById[action.effectId];
      if (!info) return state;
      const instance: ClipEffect = {
        id: makeClipId(),
        effectId: info.id,
        props: structuredClone(info.defaultProps) as Record<string, unknown>,
      };
      const clips = state.project.clips.map((c) =>
        c.id === action.clipId
          ? { ...c, effects: [...(c.effects ?? []), instance] }
          : c,
      );
      return { ...state, project: { ...state.project, clips } };
    }
    case "REMOVE_EFFECT": {
      const clips = state.project.clips.map((c) =>
        c.id === action.clipId
          ? {
              ...c,
              effects: (c.effects ?? []).filter(
                (e) => e.id !== action.effectInstanceId,
              ),
            }
          : c,
      );
      return { ...state, project: { ...state.project, clips } };
    }
    case "UPDATE_EFFECT_PROPS": {
      const clips = state.project.clips.map((c) =>
        c.id === action.clipId
          ? {
              ...c,
              effects: (c.effects ?? []).map((e) =>
                e.id === action.effectInstanceId
                  ? { ...e, props: action.props }
                  : e,
              ),
            }
          : c,
      );
      return { ...state, project: { ...state.project, clips } };
    }
    case "UPDATE_CLIP_STYLE": {
      const clips = state.project.clips.map((c) =>
        c.id === action.clipId
          ? {
              ...c,
              style: { ...(c.style ?? {}), ...action.patch },
            }
          : c,
      );
      return { ...state, project: { ...state.project, clips } };
    }
    case "RESET_CLIP_STYLE": {
      const clips = state.project.clips.map((c) =>
        c.id === action.clipId ? { ...c, style: undefined } : c,
      );
      return { ...state, project: { ...state.project, clips } };
    }
    case "SET_CLIP_FRAME": {
      const clips = state.project.clips.map((c) => {
        if (c.id !== action.clipId) return c;
        if (!action.frame) {
          const { frame: _drop, ...rest } = c;
          return rest;
        }
        return { ...c, frame: action.frame };
      });
      return { ...state, project: { ...state.project, clips } };
    }
    case "UPDATE_CLIP_TRANSITION": {
      const clips = state.project.clips.map((c) =>
        c.id === action.clipId ? { ...c, transition: action.transition } : c,
      );
      return { ...state, project: { ...state.project, clips } };
    }
    case "UPDATE_PROJECT_TRANSITION": {
      return {
        ...state,
        project: { ...state.project, defaultTransition: action.transition },
      };
    }
    case "SET_PROJECT_FORMAT": {
      // Canvas aspect/size for the whole project (preview Player + export both
      // read project.width/height). Switching to e.g. 9:16 lets portrait
      // compositions fill the frame instead of being cropped by the 16:9 stage.
      return {
        ...state,
        project: {
          ...state.project,
          width: action.width,
          height: action.height,
        },
      };
    }
    case "SET_PROJECT_NAME": {
      return {
        ...state,
        project: { ...state.project, name: action.name },
      };
    }
    case "SET_PROJECT_AUDIO": {
      return {
        ...state,
        project: { ...state.project, audio: action.audio },
      };
    }
    case "UPDATE_PROJECT_AUDIO": {
      const current = state.project.audio;
      if (!current) return state;
      return {
        ...state,
        project: {
          ...state.project,
          audio: { ...current, ...action.patch },
        },
      };
    }
    case "CLEAR_PROJECT_AUDIO": {
      const { audio: _omit, ...rest } = state.project;
      // Clearing the audio invalidates an audio selection.
      const selection =
        state.selection?.kind === "audio" ? null : state.selection;
      return {
        ...state,
        project: rest,
        selection,
      };
    }
    case "SELECT_CLIP":
      return {
        ...state,
        selection: action.clipId ? { kind: "clip", id: action.clipId } : null,
      };
    case "SELECT_AUDIO":
      return { ...state, selection: { kind: "audio" } };
    case "CLEAR_SELECTION":
      return { ...state, selection: null };
    case "TOGGLE_PANEL":
      return {
        ...state,
        openPanel: state.openPanel === action.panel ? null : action.panel,
      };
    case "LOAD_PROJECT":
      return {
        ...state,
        project: action.project,
        selection: null,
      };
  }
}

function makeClipId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
