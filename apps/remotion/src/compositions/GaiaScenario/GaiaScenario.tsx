"use client";
import {
  ChatBubbleBot,
  ChatBubbleUser,
  LoadingIndicator,
  ThinkingBubble,
  ToolCallsSection,
} from "@heygaia/chat-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { domAnimation, LazyMotion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import "@heygaia/chat-ui/styles.css";
import { computeWindows, contentProgress, type StateWindow } from "./timing";
import { TOOL_CATEGORIES } from "./toolCategories";
import type {
  BotMessageState,
  LoadingState,
  Scenario,
  ScenarioState,
  ThinkingState,
  ToolCallsState,
  UserMessageState,
} from "./types";

// chat-ui's getToolCategoryIcon expects keys exactly as they appear in
// the GAIA shared icon config. Our scenario data uses friendlier keys
// (e.g. "google_calendar") that don't normalize cleanly to chat-ui's
// internal name ("googlecalendar"). Map at the boundary.
const TOOL_CATEGORY_ALIASES: Record<string, string> = {
  google_calendar: "googlecalendar",
  google_docs: "googledocs",
  google_sheets: "googlesheets",
  google_tasks: "googletasks",
  google_meet: "googlemeet",
  calendar: "googlecalendar",
};

const ICON_URL_BY_KEY = new Map<string, string>(
  TOOL_CATEGORIES.flatMap((c) =>
    c.kind === "image" ? [[c.key, c.src] as const] : [],
  ),
);

function resolveCategoryKey(key: string | undefined): string {
  const k = (key ?? "general").trim();
  return TOOL_CATEGORY_ALIASES[k] ?? k;
}

function resolveIconUrl(key: string | undefined): string | undefined {
  const resolved = resolveCategoryKey(key);
  return (
    ICON_URL_BY_KEY.get(resolved) ?? ICON_URL_BY_KEY.get(key ?? "") ?? undefined
  );
}

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
  /** Override the user avatar shown on right-side bubbles. */
  userAvatarUrl?: string;
  /** Override the bot/GAIA logo shown on left-side bubbles. */
  botAvatarUrl?: string;
  /**
   * Whether tool_calls accordion sections render expanded by default.
   * chat-ui's ToolCallsSection collapses by default; for video where there's
   * no user interaction, expanded is the better default.
   *
   * Accepts boolean OR the strings "true" / "false" — the right-sidebar
   * select control serializes as a string, the JSON form stores it as a
   * boolean.
   */
  toolCallsExpanded?: boolean | string;
};

// chat-ui has internal `useQuery` calls (e.g. ["integrations","user"],
// ["integrations","config"]) that hit our QueryClient with no registered
// queryFn. React Query's default queryFn returns undefined, which it then
// rejects with "Query data cannot be undefined". Provide a default queryFn
// that returns null so those background queries stay quiet.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async () => null,
      retry: false,
      staleTime: Number.POSITIVE_INFINITY,
    },
  },
});

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
  userAvatarUrl,
  botAvatarUrl,
  toolCallsExpanded: toolCallsExpandedProp = "true",
}) => {
  // Select fields serialize booleans as strings — coerce.
  const toolCallsExpanded =
    typeof toolCallsExpandedProp === "string"
      ? toolCallsExpandedProp === "true"
      : toolCallsExpandedProp;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Wire avatar overrides into our next/image shim so the chat-ui bundle's
  // hardcoded image paths get swapped at render time. Set synchronously
  // during render (not in useEffect) so the first frame's <img> already
  // sees the override — Remotion's frame screenshots may capture before
  // effects flush.
  if (typeof window !== "undefined") {
    const w = window as unknown as {
      __remotionImageOverrides?: Record<string, string>;
    };
    const next: Record<string, string> = {};
    if (botAvatarUrl) next["/images/logos/logo.webp"] = botAvatarUrl;
    if (userAvatarUrl) next["/images/avatars/default.webp"] = userAvatarUrl;
    w.__remotionImageOverrides = next;
  }

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
      <LazyMotion features={domAnimation}>
        <style>
          {/* chat-ui ships a Tailwind-bundled JS but an empty styles.css.
            Tailwind in lyon scans .ts/.tsx but does NOT scan
            node_modules JS, so several utilities used inline by
            chat-ui never make it into the output stylesheet. Re-define
            the small set we actually need so the loading shimmer,
            avatar offset, follow-up actions, and tool-call rows render
            correctly without depending on Tailwind generation. */}
          {`
          @keyframes gaiaScenarioShine {
            0% { background-position: 100% 0; }
            100% { background-position: -100% 0; }
          }
          /* Loading row left-padding (chat-ui uses pl-11.5 = 2.875rem). */
          .gaia-scenario-root .pl-11\\.5 { padding-left: 2.875rem; }

          /* Shimmer text: clip the gradient to the text shape and
              animate the background-position so the highlight sweeps
              across each character. Targets the unique animate-shine
              class chat-ui puts on the loading <span>. */
          .gaia-scenario-root .animate-shine {
            background-size: 200% 100% !important;
            background-clip: text !important;
            -webkit-background-clip: text !important;
            color: transparent !important;
            -webkit-text-fill-color: transparent !important;
            animation: gaiaScenarioShine 1.4s linear infinite !important;
          }

          /* Stacked tool icons next to "Used N tools": chat-ui ships
              -space-x-2 (8px overlap). User feedback: tighten less so
              the icons are more clearly readable — drop to ~3px overlap. */
          .gaia-scenario-root .-space-x-2 > * + * {
            margin-left: -0.2rem !important;
          }

          /* Tool calls accordion content: each row needs more breathing
              room. Override chat-ui's space-y-0 + py-2 wrapper. */
          .gaia-scenario-root [data-slot="content"] > .space-y-0,
          .gaia-scenario-root [data-slot="content"] > div.space-y-0 {
            padding-top: 0.75rem !important;
            padding-bottom: 0.5rem !important;
          }
          .gaia-scenario-root [data-slot="content"] > .space-y-0 > * + *,
          .gaia-scenario-root [data-slot="content"] > div.space-y-0 > * + * {
            margin-top: 0.75rem !important;
          }

          /* Bot bubble footer (follow-ups + actions). chat-ui uses
              ml-10.75 to indent past the avatar — ensure the class
              actually has a value since Tailwind in lyon doesn't scan
              chat-ui's bundle. Slightly tighter than chat-ui's
              ml-10.75 (43px) per design feedback. */
          .gaia-scenario-root .ml-10\\.75 { margin-left: 2.25rem; }

          /* Follow-up action buttons: rounded corners, dashed outline.
              The FollowUpActions container ships
              "flex max-w-xl flex-wrap gap-2 pt-3 pb-1" — bump pt and
              gap. Buttons inside use outline-dashed; round them. */
          .gaia-scenario-root .outline-dashed {
            outline-style: dashed !important;
            outline-width: 1px !important;
            outline-color: rgb(63 63 70) !important;
            border-radius: 0.5rem !important;
          }
          .gaia-scenario-root .max-w-xl.flex-wrap {
            padding-top: 1rem !important;
            margin-left: 0.25rem !important;
            gap: 0.5rem !important;
          }

          /* Bot action buttons (reply / copy / pin / thumbs up/down):
              chat-ui hides them behind hover via inline opacity:0 +
              visibility:hidden. In a static video render there is no
              hover — force-show. Targets the actions row, which sits
              under .ml-10.75 inside a .flex.flex-col wrapper. */
          .gaia-scenario-root .ml-10\\.75 > .flex.flex-col {
            opacity: 1 !important;
            visibility: visible !important;
          }
          .gaia-scenario-root .ml-10\\.75 .flex.w-fit.items-center {
            gap: 0.375rem !important;
            margin-top: 0.5rem !important;
          }
        `}
        </style>
        {userAvatarUrl && (
          <style>
            {/* chat-ui renders the user avatar via Radix Avatar with
              user.profilePicture (always undefined in our context). The
              AvatarFallback's <img src="/images/avatars/default.webp"> is
              flaky in Remotion's frame-by-frame render because Radix's
              load-status state machine fires asynchronously. Sidestep all
              of that: paint the avatar URL as a background-image on the
              fallback slot and hide the inner <img>. */}
            {`
            [data-slot="avatar-fallback"] {
              background-image: url(${JSON.stringify(userAvatarUrl).slice(1, -1)});
              background-size: cover;
              background-position: center;
              background-color: transparent !important;
            }
            [data-slot="avatar-fallback"] > * {
              opacity: 0;
            }
          `}
          </style>
        )}
        <AbsoluteFill
          className="gaia-scenario-root"
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
              {renderVisible(
                visible,
                frame,
                activeLoading?.index ?? null,
                activeThinking?.index ?? null,
                toolCallsExpanded,
              )}
            </div>
          </div>
        </AbsoluteFill>
      </LazyMotion>
    </QueryClientProvider>
  );
};

/**
 * Render the visible windows, bundling ALL tool_calls states into a SINGLE
 * ToolCallsSection that says "Used N tools" — even when separated by
 * loading / thinking / pause states. The real GAIA UI attaches every tool
 * result a bot used during one turn to one accordion; we mirror that.
 *
 * Flush only happens on user_message / bot_message boundaries (i.e. when
 * a new chat turn starts), so loading→tool_calls→loading→tool_calls
 * collapses into one block.
 */
function renderVisible(
  visible: StateWindow[],
  frame: number,
  activeLoadingIdx: number | null,
  activeThinkingIdx: number | null,
  toolCallsExpanded: boolean,
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let toolCallsBuf: ScenarioToolEntry[] = [];
  let toolCallsKey: number | null = null;
  // Loading + thinking are scheduled BEFORE the bot bubble in the
  // scenario, but the rendered chat reads better with them anchored
  // at the bottom (after bubble + follow-up actions). Hold them and
  // append at the end of the output.
  let pendingLoading: React.ReactNode = null;
  let pendingThinking: React.ReactNode = null;

  const flushToolCalls = () => {
    if (toolCallsBuf.length > 0 && toolCallsKey !== null) {
      out.push(
        <ToolCallsView
          key={`tc-${toolCallsKey}`}
          entries={toolCallsBuf}
          toolCallsExpanded={toolCallsExpanded}
        />,
      );
      toolCallsBuf = [];
      toolCallsKey = null;
    }
  };

  for (const window of visible) {
    if (window.state.type === "tool_calls") {
      if (toolCallsKey === null) toolCallsKey = window.index;
      for (const entry of window.state.entries) {
        for (const d of entry.data) toolCallsBuf.push(d);
      }
      continue;
    }

    const progress = contentProgress(window, frame);
    switch (window.state.type) {
      case "user_message":
        flushToolCalls();
        // New turn — drop any pending loading/thinking from before.
        pendingLoading = null;
        pendingThinking = null;
        out.push(
          <UserMessageView
            key={window.index}
            state={window.state}
            progress={progress}
            index={window.index}
          />,
        );
        break;
      case "bot_message":
        flushToolCalls();
        // Once the bot has started replying, the prior loading is
        // stale — but per spec, keep loading visible if it's *still*
        // marked active (mid-stream agentic step).
        out.push(
          <BotMessageView
            key={window.index}
            state={window.state}
            progress={progress}
            index={window.index}
          />,
        );
        break;
      case "loading":
        if (activeLoadingIdx === window.index) {
          pendingLoading = (
            <LoadingView
              key={window.index}
              state={window.state}
              index={window.index}
            />
          );
        }
        break;
      case "thinking":
        if (activeThinkingIdx === window.index) {
          pendingThinking = (
            <ThinkingView key={window.index} state={window.state} />
          );
        }
        break;
      case "todo_data":
      case "image":
      case "pause":
        break;
    }
  }
  flushToolCalls();
  // Loading / thinking always trail at the very bottom, after any
  // already-rendered bot bubble + follow-up actions.
  if (pendingThinking) out.push(pendingThinking);
  if (pendingLoading) out.push(pendingLoading);
  return out;
}

type ScenarioToolEntry = ToolCallsState["entries"][number]["data"][number];

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
  // chat-ui's LoadingIndicator reads toolInfo.toolCategory through
  // getToolCategoryIcon — same alias problem as ToolCallsSection. Map
  // to chat-ui's expected key + supply iconUrl for a guaranteed match.
  //
  // When toolInfo is missing (or toolCategory empty), chat-ui falls
  // back to <WaveSpinnerSquare> — the generic "thinking" indicator.
  // The editor exposes that as the "Wave spinner" indicator option.
  const toolInfo = useMemo(() => {
    if (!state.toolInfo) return undefined;
    if (!state.toolInfo.toolCategory) return undefined;
    return {
      ...state.toolInfo,
      toolCategory: resolveCategoryKey(state.toolInfo.toolCategory),
      iconUrl:
        (state.toolInfo as { iconUrl?: string }).iconUrl ??
        resolveIconUrl(state.toolInfo.toolCategory),
    };
  }, [state.toolInfo]);

  return (
    <LoadingIndicator
      loadingText={state.text}
      loadingTextKey={index}
      toolInfo={toolInfo}
    />
  );
}

function ThinkingView({ state }: { state: ThinkingState }) {
  return <ThinkingBubble thinkingContent={state.content} />;
}

function ToolCallsView({
  entries,
  toolCallsExpanded,
}: {
  entries: ScenarioToolEntry[];
  toolCallsExpanded: boolean;
}) {
  // chat-ui's ToolCallsSection prefers `call.message` for the per-row
  // title and only falls back to a formatted `tool_name` when message
  // is missing. Users want the tool name shown — strip message and let
  // the fallback do its job.
  //
  // Also normalise tool_category so chat-ui's getToolCategoryIcon hits
  // the right entry, and inject `icon_url` (chat-ui checks it first)
  // pointing at the asset we serve from /images/icons.
  const normalised = useMemo(
    () =>
      entries.map((e) => {
        const category = resolveCategoryKey(e.tool_category);
        const iconUrl = resolveIconUrl(e.tool_category);
        return {
          ...e,
          tool_category: category,
          message: undefined,
          icon_url: iconUrl,
        };
      }),
    [entries],
  );

  // chat-ui's ToolCallsSection holds its expanded state internally and
  // starts collapsed. Programmatically click the accordion's trigger
  // button so the demo always renders the expanded view.
  //
  // HeroUI's dataAttr() returns true OR undefined — so closed buttons
  // have NO `data-open` attribute (not data-open="false"). React Aria's
  // useButton sets `aria-expanded` reliably on accordion buttons, so
  // target that instead. We retry on the next animation frame in case
  // the button isn't queryable on the synchronous useLayoutEffect tick.
  const containerRef = useRef<HTMLDivElement>(null);

  // Order matters: the native click guard must be ATTACHED before the
  // synthetic trigger.click() below. Otherwise the first click fires
  // during the same useEffect tick and the listener doesn't catch it,
  // letting the click bubble to any wrapping <Link> and trigger anchor
  // navigation. We combine both into one effect so registration order
  // is unambiguous, and run the guard hookup before the click.
  useEffect(() => {
    if (!toolCallsExpanded) return;
    const el = containerRef.current;
    if (!el) return;

    const guard = (e: MouseEvent) => {
      if (!e.isTrusted) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    el.addEventListener("click", guard);

    let cancelled = false;
    const tryOpen = () => {
      if (cancelled) return;
      const trigger = el.querySelector<HTMLButtonElement>(
        'button[aria-expanded="false"]',
      );
      if (trigger) trigger.click();
    };
    tryOpen();
    const raf = requestAnimationFrame(tryOpen);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      el.removeEventListener("click", guard);
    };
  }, [toolCallsExpanded, normalised]);

  return (
    <div ref={containerRef} style={{ marginLeft: 36 }}>
      <ToolCallsSection tool_calls_data={normalised as never} />
    </div>
  );
}
