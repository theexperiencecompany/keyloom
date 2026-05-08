"use client";
import {
  ChatBubbleBot,
  ChatBubbleUser,
  LoadingIndicator,
  ThinkingBubble,
  ToolCallsSection,
} from "@heygaia/chat-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
  // Top-level overrides — every individual setting is a primitive field
  // in the right sidebar. The full state machine lives in scenarioJson
  // under the "Advanced options" section.
  title?: string;
  theme?: "dark" | "light";
  backgroundColor?: string;
  padding?: number;
  borderRadius?: number;
  /**
   * Visual scale for the chat content. chat-ui ships at native mobile
   * pixel sizes (~16px base font); for video output at 1080×1920 we
   * scale up so messages read at MessageBubbles-equivalent size.
   * Default 2.5.
   */
  scale?: number;
};

const queryClient = new QueryClient();

const FALLBACK_SCENARIO: Scenario = {
  id: "fallback",
  title: "Invalid scenario JSON",
  viewport: { width: 390, height: 844 },
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
      viewport: parsed.viewport ?? FALLBACK_SCENARIO.viewport,
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

export const GaiaScenario: React.FC<GaiaScenarioProps> = ({
  scenarioJson,
  title,
  theme,
  backgroundColor,
  padding = 32,
  borderRadius = 0,
  scale = 2.5,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scenario = useMemo(
    () => safeParseScenario(scenarioJson),
    [scenarioJson],
  );
  const windows = useMemo(() => computeWindows(scenario, fps), [scenario, fps]);

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

  const resolvedTheme = theme ?? scenario.settings.theme ?? "dark";
  const isDark = resolvedTheme !== "light";
  const bg = backgroundColor || (isDark ? "#0f1014" : "#ffffff");
  const fg = isDark ? "#f5f5f7" : "#0f1014";
  const headerLabel = title ?? scenario.title;

  return (
    <QueryClientProvider client={queryClient}>
      <AbsoluteFill
        style={{
          background: bg,
          color: fg,
          borderRadius,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
        }}
      >
        {headerLabel && (
          <div
            style={{
              padding: `${Math.round(padding * 0.6)}px ${padding}px`,
              fontSize: 14,
              fontWeight: 500,
              opacity: 0.6,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            {headerLabel}
          </div>
        )}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding,
            overflow: "hidden",
          }}
        >
          {/*
           * chat-ui ships at native mobile pixel sizes. Use a CSS transform to
           * scale the entire chat surface up to MessageBubbles-equivalent size.
           * Width is divided by scale so the layout box still fills the parent.
           */}
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "bottom center",
              width: `${100 / scale}%`,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              gap: 12,
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
    </QueryClientProvider>
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
