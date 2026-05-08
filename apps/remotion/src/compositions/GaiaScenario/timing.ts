// Pure frame-driven state machine timing.
// Converts scenario JSON state durations (ms) into Remotion frame windows
// at a given fps. No real-time timers, no side effects.

import type { Scenario, ScenarioState, ScenarioStateType } from "./types";

const TOOL_CALLS_BASE_MS = 250;

const msToFrames = (ms: number, fps: number): number =>
  Math.max(0, Math.round((ms / 1000) * fps));

/**
 * Returns how long the *content* of a state takes in milliseconds,
 * excluding its trailing pauseAfter.
 */
function contentDurationMs(state: ScenarioState): number {
  switch (state.type) {
    case "user_message":
      return state.text.length * state.typingSpeed;
    case "bot_message":
      return state.text.length * state.streamingSpeed;
    case "loading":
      return state.duration;
    case "thinking":
      return state.duration;
    case "tool_calls":
      return TOOL_CALLS_BASE_MS;
    case "pause":
      return state.duration;
    case "todo_data":
      return 0;
    case "image":
      return 0;
  }
}

function pauseAfterMs(state: ScenarioState): number {
  if ("pauseAfter" in state && typeof state.pauseAfter === "number") {
    return state.pauseAfter;
  }
  return 0;
}

export type StateWindow = {
  index: number;
  state: ScenarioState;
  type: ScenarioStateType;
  startFrame: number;
  contentDurationFrames: number;
  pauseFrames: number;
  endFrame: number;
};

/**
 * Compute a frame window for every state in the scenario, sequentially.
 * `endFrame` is exclusive (next state's startFrame).
 */
export function computeWindows(scenario: Scenario, fps: number): StateWindow[] {
  const windows: StateWindow[] = [];
  let cursor = 0;
  scenario.states.forEach((state, index) => {
    const contentFrames = msToFrames(contentDurationMs(state), fps);
    const pauseFrames = msToFrames(pauseAfterMs(state), fps);
    const startFrame = cursor;
    const endFrame = startFrame + contentFrames + pauseFrames;
    windows.push({
      index,
      state,
      type: state.type,
      startFrame,
      contentDurationFrames: contentFrames,
      pauseFrames,
      endFrame,
    });
    cursor = endFrame;
  });
  return windows;
}

export function totalDurationFrames(scenario: Scenario, fps: number): number {
  const windows = computeWindows(scenario, fps);
  if (windows.length === 0) return 0;
  return windows[windows.length - 1]!.endFrame;
}

/**
 * Local progress 0..1 through the *content* portion of a window at a given frame.
 * Values < 0 mean "not started yet"; values >= 1 mean "content finished
 * (in trailing pause or beyond)".
 */
export function contentProgress(window: StateWindow, frame: number): number {
  if (window.contentDurationFrames <= 0) {
    return frame >= window.startFrame ? 1 : -1;
  }
  const local = frame - window.startFrame;
  if (local < 0) return -1;
  return local / window.contentDurationFrames;
}
