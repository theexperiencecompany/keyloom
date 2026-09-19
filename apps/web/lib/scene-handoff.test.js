import { describe, expect, test } from "bun:test";
import { compositionsById } from "@workspace/compositions/registry";
import {
  initialStudioState,
  studioReducer,
} from "@/features/studio/state/reducer";
import { resolveCompositionMeta } from "./composition-meta";
import { storeSceneProject, takeSceneProject } from "./scene-handoff";

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

describe("showcase to Studio", () => {
  test("keeps customized conversation, computed duration and portrait canvas through Studio loading", () => {
    const info = compositionsById.MessageBubbles;
    const props = structuredClone(info.defaultProps);
    props.contactName = "Showcase test";
    props.orientation = "portrait";
    props.messages.push({
      text: "An extra message",
      side: "right",
      typingFrames: 120,
      delay: 60,
    });
    const meta = resolveCompositionMeta(info, props);
    const project = {
      name: info.title,
      fps: meta.fps,
      width: meta.width,
      height: meta.height,
      clips: [
        {
          id: "scene-test",
          compositionId: info.id,
          props,
          durationInFrames: meta.durationInFrames,
        },
      ],
    };
    const storage = memoryStorage();
    storeSceneProject(storage, project);
    const loaded = takeSceneProject(storage);
    const state = studioReducer(initialStudioState, {
      type: "LOAD_PROJECT",
      project: loaded,
    });
    expect(state.project).toEqual(project);
    expect(state.project.height).toBeGreaterThan(state.project.width);
    expect(state.project.clips[0].durationInFrames).toBeGreaterThan(
      info.durationInFrames,
    );
    expect(takeSceneProject(storage)).toBeNull();
    expect(info.defaultProps.contactName).not.toBe("Showcase test");
  });

  test("does not read another tab's pending scene", () => {
    const first = memoryStorage();
    const second = memoryStorage();
    storeSceneProject(first, { fps: 30, width: 1920, height: 1080, clips: [] });
    expect(takeSceneProject(second)).toBeNull();
    expect(takeSceneProject(first)).not.toBeNull();
  });

  test("rejects and clears invalid saved data", () => {
    const storage = memoryStorage();
    storage.setItem("keyloom-scene-preview", "broken JSON");
    expect(takeSceneProject(storage)).toBeNull();
    expect(storage.getItem("keyloom-scene-preview")).toBeNull();
    storage.setItem(
      "keyloom-scene-preview",
      JSON.stringify({ fps: -1, clips: [] }),
    );
    expect(takeSceneProject(storage)).toBeNull();
  });

  test("surfaces storage failures so the page can keep the user's edits", () => {
    const storage = {
      ...memoryStorage(),
      setItem: () => {
        throw new Error("Storage disabled");
      },
    };
    expect(() => storeSceneProject(storage, { clips: [] })).toThrow(
      "Storage disabled",
    );
  });
});
