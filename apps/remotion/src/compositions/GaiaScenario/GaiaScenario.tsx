"use client";
import {
  ChatBubbleBot,
  ChatBubbleUser,
  LoadingIndicator,
  ThinkingBubble,
  ToolCallsSection,
} from "@heygaia/chat-ui";
import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import "@heygaia/chat-ui/styles.css";
import { computeWindows, contentProgress, type StateWindow } from "./timing";
import type {
  BotMessageState,
  LoadingState,
  Scenario,
  ScenarioState,
  ThinkingState,
  ToolCallsState,
  UserMessageState,
} from "./types";

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
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.states)
    ) {
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
  const chars = Math.max(
    0,
    Math.min(text.length, Math.floor(text.length * progress)),
  );
  return text.slice(0, chars);
}

export const GaiaScenario: React.FC<GaiaScenarioProps> = ({ scenarioJson }) => {
  const frame = useCurrentFrame();
  const { fps, width: canvasWidth, height: canvasHeight } = useVideoConfig();

  const scenario = useMemo(
    () => safeParseScenario(scenarioJson),
    [scenarioJson],
  );
  const windows = useMemo(() => computeWindows(scenario, fps), [scenario, fps]);

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
        <UserMessageView
          state={window.state}
          progress={progress}
          index={window.index}
        />
      );
    case "bot_message":
      return (
        <BotMessageView
          state={window.state}
          progress={progress}
          index={window.index}
        />
      );
    case "loading":
      if (!isActiveLoading) return null;
      return <LoadingView state={window.state} index={window.index} />;
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

// Static rendering doesn't have live React state for image dialogs etc.
// Pass no-op dispatchers to satisfy the chat-ui prop contract.
const noopSetOpen = (() => {}) as React.Dispatch<React.SetStateAction<boolean>>;
const noopSetImageData = (() => {}) as React.Dispatch<
  React.SetStateAction<{ src: string; prompt: string; improvedPrompt: string }>
>;

// chat-ui's BaseMessageData is `typeof SCHEMA` (every key required, value
// possibly undefined). Provide a complete base shape so consumers don't have
// to enumerate every optional field.
const baseMessage = (message_id: string) =>
  ({
    message_id,
    date: undefined,
    pinned: undefined,
    fileIds: undefined,
    fileData: undefined,
    selectedTool: undefined,
    toolCategory: undefined,
    selectedWorkflow: undefined,
    selectedCalendarEvent: undefined,
    isConvoSystemGenerated: undefined,
    follow_up_actions: undefined,
    image_data: undefined,
    memory_data: undefined,
    todo_progress: undefined,
    replyToMessage: undefined,
    // Tool fields — chat-ui spreads TOOLS_MESSAGE_SCHEMA into the base.
    // We don't know every key statically; cast as a record covers it.
  }) as Record<string, unknown>;

function UserMessageView({
  state,
  progress,
  index,
}: {
  state: UserMessageState;
  progress: number;
  index: number;
}) {
  const text = progressiveText(state.text, progress);
  if (!text) return null;
  const id = `user-${index}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Bubble = ChatBubbleUser as any;
  return <Bubble {...baseMessage(id)} message_id={id} text={text} />;
}

function BotMessageView({
  state,
  progress,
  index,
}: {
  state: BotMessageState;
  progress: number;
  index: number;
}) {
  const text = progressiveText(state.text, progress);
  if (!text) return null;
  const isComplete = progress >= 1;
  const id = `bot-${index}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Bubble = ChatBubbleBot as any;
  return (
    <Bubble
      {...baseMessage(id)}
      message_id={id}
      text={text}
      // tool_data / follow_up_actions / image_data attach once the bot finishes streaming.
      tool_data={isComplete ? state.tool_data : undefined}
      follow_up_actions={isComplete ? state.follow_up_actions : undefined}
      image_data={isComplete ? state.image_data : undefined}
      setOpenImage={noopSetOpen}
      setImageData={noopSetImageData}
    />
  );
}

function LoadingView({ state, index }: { state: LoadingState; index: number }) {
  return (
    <LoadingIndicator
      loadingText={state.text}
      loadingTextKey={index}
      toolInfo={state.toolInfo}
    />
  );
}

function ThinkingView({ state }: { state: ThinkingState }) {
  return <ThinkingBubble thinkingContent={state.content} />;
}

function ToolCallsView({ state }: { state: ToolCallsState }) {
  // Flatten the scenario's nested entries into the tool_calls_data shape
  // the chat-ui ToolCallsSection expects.
  const tool_calls_data = state.entries.flatMap((entry) =>
    entry.data.map((d) => ({
      tool_name: d.tool_name,
      tool_category: d.tool_category,
      message: d.message,
      inputs: d.inputs,
      output: d.output,
    })),
  );
  return <ToolCallsSection tool_calls_data={tool_calls_data as never} />;
}
