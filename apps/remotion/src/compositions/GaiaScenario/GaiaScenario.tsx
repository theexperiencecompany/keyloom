"use client";
import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  ChatBubbleUser,
  ChatBubbleBot,
  LoadingIndicator,
  ToolCallsSection,
  ThinkingBubble,
} from "@heygaia/chat-ui";
import "@heygaia/chat-ui/styles.css";
import type {
  BotMessageState,
  LoadingState,
  Scenario,
  ScenarioState,
  ThinkingState,
  ToolCallsState,
  UserMessageState,
} from "./types";
import {
  computeWindows,
  contentProgress,
  type StateWindow,
} from "./timing";

export type GaiaScenarioProps = {
  scenarioJson: string;
};

const DEFAULT_VIEWPORT = { width: 390, height: 844 };

const FALLBACK_SCENARIO: Scenario = {
  id: "fallback",
  title: "Invalid scenario JSON",
  viewport: DEFAULT_VIEWPORT,
  settings: { theme: "dark" },
  states: [],
};

function safeParseScenario(json: string): Scenario {
  try {
    const parsed = JSON.parse(json) as Partial<Scenario>;
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.states)) {
      return FALLBACK_SCENARIO;
    }
    return {
      id: parsed.id ?? "untitled",
      title: parsed.title ?? "Untitled",
      viewport: parsed.viewport ?? DEFAULT_VIEWPORT,
      settings: parsed.settings ?? { theme: "dark" },
      states: parsed.states as ScenarioState[],
    };
  } catch {
    return FALLBACK_SCENARIO;
  }
}

/**
 * Slice text by progress 0..1, simulating a typing/streaming effect.
 */
function progressiveText(text: string, progress: number): string {
  if (progress <= 0) return "";
  if (progress >= 1) return text;
  const chars = Math.max(0, Math.min(text.length, Math.floor(text.length * progress)));
  return text.slice(0, chars);
}

export const GaiaScenario: React.FC<GaiaScenarioProps> = ({ scenarioJson }) => {
  const frame = useCurrentFrame();
  const { fps, width: canvasWidth, height: canvasHeight } = useVideoConfig();

  const scenario = useMemo(() => safeParseScenario(scenarioJson), [scenarioJson]);
  const windows = useMemo(
    () => computeWindows(scenario, fps),
    [scenario, fps],
  );

  const viewport = scenario.viewport ?? DEFAULT_VIEWPORT;

  // Fit the scenario viewport inside the canvas while preserving aspect ratio.
  const scale = Math.min(
    canvasWidth / viewport.width,
    canvasHeight / viewport.height,
  );

  // Visible windows: any state whose startFrame has been reached.
  const visible = windows.filter((w) => frame >= w.startFrame);

  // The currently-active loading window (if any). We hide loading once the
  // *next* state has started, regardless of pauseAfter overlap.
  const activeLoading = visible.find((w, i) => {
    if (w.type !== "loading") return false;
    const next = windows[i + 1];
    return !next || frame < next.startFrame;
  });

  // Same idea for thinking.
  const activeThinking = visible.find((w, i) => {
    if (w.type !== "thinking") return false;
    const next = windows[i + 1];
    return !next || frame < next.startFrame;
  });

  const isDark = scenario.settings.theme !== "light";

  return (
    <AbsoluteFill
      style={{
        background: isDark ? "#0a0a0a" : "#f5f5f7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: viewport.width,
          height: viewport.height,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          background: isDark ? "#0f1014" : "#ffffff",
          borderRadius: 48,
          overflow: "hidden",
          boxShadow: "0 50px 100px rgba(0,0,0,0.45)",
          color: isDark ? "#f5f5f7" : "#0f1014",
          display: "flex",
          flexDirection: "column",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 16,
            gap: 12,
            overflow: "hidden",
          }}
        >
          {visible.map((window) => (
            <StateRenderer
              key={window.index}
              window={window}
              frame={frame}
              isActiveLoading={activeLoading?.index === window.index}
              isActiveThinking={activeThinking?.index === window.index}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

type StateRendererProps = {
  window: StateWindow;
  frame: number;
  isActiveLoading: boolean;
  isActiveThinking: boolean;
};

function StateRenderer({
  window,
  frame,
  isActiveLoading,
  isActiveThinking,
}: StateRendererProps) {
  const progress = contentProgress(window, frame);

  switch (window.state.type) {
    case "user_message":
      return (
        <UserMessageView state={window.state} progress={progress} />
      );
    case "bot_message":
      return (
        <BotMessageView state={window.state} progress={progress} />
      );
    case "loading":
      if (!isActiveLoading) return null;
      return <LoadingView state={window.state} />;
    case "thinking":
      if (!isActiveThinking) return null;
      return <ThinkingView state={window.state} />;
    case "tool_calls":
      return <ToolCallsView state={window.state} />;
    case "todo_data":
    case "image":
    case "pause":
      return null;
  }
}

function UserMessageView({
  state,
  progress,
}: {
  state: UserMessageState;
  progress: number;
}) {
  const text = progressiveText(state.text, progress);
  if (!text) return null;
  return <ChatBubbleUser text={text} />;
}

function BotMessageView({
  state,
  progress,
}: {
  state: BotMessageState;
  progress: number;
}) {
  const text = progressiveText(state.text, progress);
  if (!text) return null;
  return (
    <ChatBubbleBot
      text={text}
      toolData={progress >= 1 ? state.tool_data : undefined}
      followUpActions={progress >= 1 ? state.follow_up_actions : undefined}
      imageData={progress >= 1 ? state.image_data : undefined}
    />
  );
}

function LoadingView({ state }: { state: LoadingState }) {
  return <LoadingIndicator text={state.text} toolInfo={state.toolInfo} />;
}

function ThinkingView({ state }: { state: ThinkingState }) {
  return <ThinkingBubble content={state.content} />;
}

function ToolCallsView({ state }: { state: ToolCallsState }) {
  return <ToolCallsSection entries={state.entries} />;
}
