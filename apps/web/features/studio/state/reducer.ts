import type { ClipStyle } from "@workspace/compositions/clip-style";
import { effectsById } from "@workspace/compositions/effects/registry";
import type { ClipEffect } from "@workspace/compositions/effects/schema";
import {
  type Clip,
  DEFAULT_PROJECT,
  type Project,
} from "@workspace/compositions/project";
import { compositionsById } from "@workspace/compositions/registry";
import type { SceneTransition } from "@workspace/compositions/transitions";

export type StudioPanel = "library" | "agent" | null;

export type StudioState = {
  project: Project;
  selectedClipId: string | null;
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
  | { type: "TOGGLE_PANEL"; panel: StudioPanel }
  | { type: "UPDATE_CLIP_STYLE"; clipId: string; patch: Partial<ClipStyle> }
  | { type: "RESET_CLIP_STYLE"; clipId: string }
  | {
      type: "UPDATE_CLIP_TRANSITION";
      clipId: string;
      transition: SceneTransition | undefined;
    }
  | {
      type: "UPDATE_PROJECT_TRANSITION";
      transition: SceneTransition | undefined;
    }
  | { type: "LOAD_PROJECT"; project: Project };

export const initialStudioState: StudioState = {
  project: DEFAULT_PROJECT,
  selectedClipId: null,
  openPanel: null,
};

export function studioReducer(
  state: StudioState,
  action: StudioAction,
): StudioState {
  switch (action.type) {
    case "ADD_CLIP": {
      const info = compositionsById[action.compositionId];
      if (!info) return state;
      const clip: Clip = {
        id: makeClipId(),
        compositionId: info.id,
        props: structuredClone(info.defaultProps) as Record<string, unknown>,
        durationInFrames: info.durationInFrames,
      };
      return {
        ...state,
        project: { ...state.project, clips: [...state.project.clips, clip] },
        selectedClipId: clip.id,
      };
    }
    case "DELETE_CLIP": {
      const clips = state.project.clips.filter((c) => c.id !== action.clipId);
      return {
        ...state,
        project: { ...state.project, clips },
        selectedClipId:
          state.selectedClipId === action.clipId ? null : state.selectedClipId,
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
      const clips = state.project.clips.map((c) =>
        c.id === action.clipId ? { ...c, props: action.props } : c,
      );
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
    case "SELECT_CLIP":
      return { ...state, selectedClipId: action.clipId };
    case "TOGGLE_PANEL":
      return {
        ...state,
        openPanel: state.openPanel === action.panel ? null : action.panel,
      };
    case "LOAD_PROJECT":
      return {
        ...state,
        project: action.project,
        selectedClipId: null,
      };
  }
}

function makeClipId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
