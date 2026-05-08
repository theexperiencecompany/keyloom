import {
  type Clip,
  DEFAULT_PROJECT,
  type Project,
} from "@workspace/compositions/project";
import { compositionsById } from "@workspace/compositions/registry";

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
  | { type: "SELECT_CLIP"; clipId: string | null }
  | { type: "TOGGLE_PANEL"; panel: StudioPanel }
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
