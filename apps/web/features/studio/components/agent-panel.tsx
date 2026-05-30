"use client";

import { useChat } from "@ai-sdk/react";
import {
  ArrowUp01Icon,
  Cancel01Icon,
  RefreshIcon,
  SparklesIcon,
  StopCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Project } from "@workspace/compositions/project";
import { compositionsById } from "@workspace/compositions/registry";
import type { SceneTransition } from "@workspace/compositions/transitions";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { WaveSpinner } from "@workspace/ui/components/wave-spinner";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import {
  type ToolCallEntry,
  ToolCallsSection,
} from "@/components/agent/tool-calls-section";
import { getToolMeta, toolMessageFor } from "@/lib/agent/tool-categories";
import { parseProjectJson } from "../lib/project-io";
import type { StudioAction } from "../state/reducer";

type Props = {
  project: Project;
  dispatch: React.Dispatch<StudioAction>;
  onClose: () => void;
};

const SUGGESTIONS = [
  "Make a 20s product launch video",
  "Show a tweet, then a Slack reaction",
  "Intro title → browser walkthrough → outro",
];

// Cap on how many times the SDK will auto-continue per user message.
// Surgical edits ("add a tweet card") need: listClips → listScenesInCategory
// → getSceneDetails → addClip → updateClipProps — that's 5 tool turns
// before the terminal-tool short-circuit fires on addClip/updateClipProps.
// Set generously so multi-step edits aren't truncated mid-flow; the
// terminal-tool short-circuit ends the loop early on successful builds.
const MAX_AUTO_CONTINUATIONS_PER_USER_MESSAGE = 12;

export function AgentPanel({ project, dispatch, onClose }: Props) {
  // Keep the latest project in a ref so onToolCall (closed over at mount)
  // always sees current clips/ids instead of a stale snapshot.
  const projectRef = useRef(project);
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  // Tracks how many times the SDK has auto-continued since the user
  // last sent a message. We compare to the cap inside
  // `sendAutomaticallyWhen` to break runaway loops.
  const autoContinuationCount = useRef(0);

  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    regenerate,
    addToolResult,
  } = useChat({
    sendAutomaticallyWhen: (args) => {
      const ready = lastAssistantMessageIsCompleteWithToolCalls(args);
      if (!ready) return false;

      // Terminal-tool short-circuit: if the last assistant message
      // includes a successful build (or clear/edit) tool result, that
      // IS the final action. Don't auto-continue waiting for the model
      // to emit a follow-up text turn — gpt-4.1-mini frequently doesn't,
      // and burning more turns on it just gets the UI stuck.
      const lastMsg = args.messages[args.messages.length - 1];
      if (lastMsg?.role === "assistant") {
        const hasTerminalResult = lastMsg.parts.some((p) => {
          if (
            p.type !== "tool-buildProject" &&
            p.type !== "tool-clearProject" &&
            p.type !== "tool-addClip" &&
            p.type !== "tool-deleteClip" &&
            p.type !== "tool-updateClipProps" &&
            p.type !== "tool-updateClipStyle" &&
            p.type !== "tool-updateClipDuration"
          ) {
            return false;
          }
          const out = (p as { output?: unknown }).output;
          return (
            typeof out === "object" &&
            out !== null &&
            (out as { ok?: unknown }).ok === true
          );
        });
        if (hasTerminalResult) return false;
      }

      if (
        autoContinuationCount.current >= MAX_AUTO_CONTINUATIONS_PER_USER_MESSAGE
      ) {
        // Hit the cap — refuse to auto-continue. Status will fall back
        // to "ready" and the input re-enables.
        return false;
      }
      autoContinuationCount.current += 1;
      return true;
    },
    onToolCall: async ({ toolCall }) => {
      const name = toolCall.toolName;
      const input = toolCall.input as Record<string, unknown>;
      try {
        const output = runClientTool(name, input, projectRef, dispatch);
        if (output === undefined) return; // server-executed tool, ignore
        await addToolResult({
          tool: name as never,
          toolCallId: toolCall.toolCallId,
          output: output as never,
        });
      } catch (err) {
        await addToolResult({
          tool: name as never,
          toolCallId: toolCall.toolCallId,
          output: {
            error: err instanceof Error ? err.message : String(err),
          } as never,
        });
      }
    },
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hard safety net for status getting stuck at "streaming" with no
  // activity — re-evaluated whenever a message changes. If 4 seconds
  // pass with no new message activity, we declare the chat idle even
  // if the SDK hasn't transitioned status.
  const [forceIdle, setForceIdle] = useState(false);
  const lastActivitySig = useRef<string>("");
  useEffect(() => {
    // Build a cheap signature of "message state" that changes whenever
    // any message gains/loses parts or text grows.
    const sig = messages
      .map((m) => `${m.id}:${m.parts.length}:${JSON.stringify(m.parts).length}`)
      .join("|");
    if (sig !== lastActivitySig.current) {
      lastActivitySig.current = sig;
      setForceIdle(false);
    }
    if (status !== "streaming" && status !== "submitted") return;
    const t = setTimeout(() => setForceIdle(true), 4000);
    return () => clearTimeout(t);
  }, [messages, status]);

  // SDK's `status` sometimes lingers at "streaming" after the model
  // has effectively finished. The ONLY reliable "the agent is done"
  // signal is a successful terminal-tool result (buildProject /
  // addClip / etc.) — text alone doesn't mean done because the agent
  // emits an opener BEFORE running tools and is clearly still working.
  // Stream-end (status → "ready") and the 4-second forceIdle handle
  // the other "done" cases.
  const lastMessage = messages[messages.length - 1];
  const TERMINAL_TOOL_TYPES = new Set([
    "tool-buildProject",
    "tool-clearProject",
    "tool-addClip",
    "tool-deleteClip",
    "tool-updateClipProps",
    "tool-updateClipStyle",
    "tool-updateClipDuration",
  ]);
  const hasSuccessfulTerminal =
    lastMessage?.role === "assistant" &&
    lastMessage.parts.some((p) => {
      if (!TERMINAL_TOOL_TYPES.has(p.type)) return false;
      const out = (p as { output?: unknown }).output;
      return (
        typeof out === "object" &&
        out !== null &&
        (out as { ok?: unknown }).ok === true
      );
    });
  const hasPendingTool =
    lastMessage?.role === "assistant" &&
    lastMessage.parts.some(
      (p) =>
        p.type.startsWith("tool-") &&
        (p as { output?: unknown }).output === undefined,
    );
  const lastAssistantSettled = !hasPendingTool && hasSuccessfulTerminal;
  const isBusy =
    (status === "submitted" || status === "streaming") &&
    !lastAssistantSettled &&
    !forceIdle;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    // If a build is still in flight, cancel it before queuing the new
    // message. Without this the new sendMessage call gets dropped by
    // useChat ("can't send while not ready") and the user's input
    // disappears into the void.
    if (isBusy) {
      await stop();
    }
    autoContinuationCount.current = 0;
    sendMessage({ text: trimmed });
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <HugeiconsIcon icon={SparklesIcon} className="size-3.5" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Agent</p>
            <p className="text-[11px] text-muted-foreground">
              Brief it, get a video
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="size-6"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
        </Button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <EmptyState onPick={send} />
        ) : (
          <ul className="space-y-3">
            {messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              return (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isStreaming={
                    status === "streaming" && isLast && m.role === "assistant"
                  }
                />
              );
            })}
            {/*
              ONE persistent activity indicator. Lives at the bottom of
              the list and stays visible the entire time the chat is
              busy — never flickers or moves position. Phrase pool
              switches based on whether an assistant message has started
              forming yet.
            */}
            {isBusy ? (
              <li className="flex items-center gap-2 py-1">
                <WaveSpinner size="sm" pattern="square3x3" color="primary" />
                <ThinkingPhrase
                  pool={
                    lastMessage?.role === "assistant" ? "working" : "planning"
                  }
                />
              </li>
            ) : null}
            {error ? (
              <li className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive">
                <span className="font-medium">Agent error</span>
                <span className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed opacity-90">
                  {humanizeAgentError(error)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => regenerate()}
                  className="h-7 self-start"
                >
                  <HugeiconsIcon icon={RefreshIcon} className="size-3" />
                  Retry
                </Button>
              </li>
            ) : null}
          </ul>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-border p-3"
      >
        <div className="flex items-end gap-2 rounded-lg border border-border bg-muted/40 p-2 focus-within:border-ring/60">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isBusy
                ? "Compose your next message — Stop to send now…"
                : "Describe the video you want…"
            }
            rows={1}
            className="min-h-0 flex-1 resize-none border-0 bg-transparent p-1 text-[13px] focus-visible:ring-0 focus-visible:outline-none"
          />
          {isBusy && input.trim().length === 0 ? (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={() => stop()}
              className="size-7 shrink-0 rounded-md"
              title="Stop"
            >
              <HugeiconsIcon icon={StopCircleIcon} className="size-3.5" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={input.trim().length === 0}
              className="size-7 shrink-0 rounded-md"
              title={isBusy ? "Stop current run and send" : "Send"}
            >
              <HugeiconsIcon icon={ArrowUp01Icon} className="size-3.5" />
            </Button>
          )}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground/70">
          Enter to send · Shift+Enter for newline
        </p>
      </form>
    </aside>
  );
}

/**
 * Executes the client-side studio tools the agent calls. Returns the result
 * to send back to the model, or `undefined` for tools whose execute lives
 * server-side (those return a result automatically through the stream).
 */
function runClientTool(
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
      // Wait one microtask so React commits before we read the ref.
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
      // Same pattern as addClip — the reducer mints the instance id; we
      // observe it via microtask flush from the post-dispatch snapshot.
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

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-2 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <HugeiconsIcon icon={SparklesIcon} className="size-5" />
      </div>
      <div>
        <p className="text-sm font-medium">Stitch a video from a brief</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Tell the agent what you want and it will pick scenes from the library,
          set props, and lay them out on the timeline.
        </p>
      </div>
      <ul className="w-full space-y-1.5">
        {SUGGESTIONS.map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => onPick(s)}
              className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-left text-[12px] text-muted-foreground transition-colors hover:border-border/80 hover:bg-muted hover:text-foreground"
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

type ChatMessage = ReturnType<typeof useChat>["messages"][number];

function MessageBubble({
  message,
  isStreaming,
}: {
  message: ChatMessage;
  /** Raw SDK streaming flag — drives Streamdown's animation only. */
  isStreaming: boolean;
}) {
  const isUser = message.role === "user";
  const text = message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
  const toolCalls = isUser ? [] : extractToolCalls(message);

  // If the model never emitted final text after a build (some models
  // forget despite the system-prompt rule), synthesize a fallback so
  // the user isn't staring at a wall of tool calls with no summary.
  // We show the fallback as soon as buildProject returns ok — no need
  // to wait for isStreaming to flip off, since at that point the model
  // is just being nudged to write the summary it forgot to write.
  const buildResult = toolCalls.find(
    (c) =>
      (c.toolName === "buildFromTemplate" || c.toolName === "buildProject") &&
      c.output !== undefined,
  );
  const buildOk =
    buildResult?.output && typeof buildResult.output === "object"
      ? (buildResult.output as { ok?: boolean }).ok === true
      : false;
  const buildFailed = buildResult !== undefined && !buildOk;

  // Any tool returning ok:true counts as a terminal-result success —
  // includes addClip / updateClipProps / deleteClip etc. for surgical
  // edits, not just buildProject. Used to hide the working shimmer
  // even when the model never emits a follow-up text turn.
  const anyTerminalSuccess = toolCalls.some((c) => {
    const out = c.output;
    return (
      typeof out === "object" &&
      out !== null &&
      (out as { ok?: unknown }).ok === true
    );
  });

  let fallbackText = "";
  if (!text && toolCalls.length > 0) {
    if (buildOk) {
      const clipCount =
        buildResult?.output && typeof buildResult.output === "object"
          ? Number(
              (buildResult.output as { clipsLoaded?: number }).clipsLoaded ?? 0,
            )
          : 0;
      fallbackText = clipCount
        ? `Built a ${clipCount}-clip project. Tweak it from the inspector or ask me to change something.`
        : "Build complete.";
    } else if (buildFailed) {
      const errMsg =
        buildResult?.output && typeof buildResult.output === "object"
          ? String((buildResult.output as { error?: string }).error ?? "")
          : "";
      fallbackText = errMsg
        ? `Build failed: ${errMsg}`
        : "Build failed — see tool output above.";
    } else if (anyTerminalSuccess) {
      // Surgical edit (addClip / updateClipProps / etc.) succeeded but
      // the model didn't follow up with text. Surface a generic done
      // so the shimmer hides immediately.
      fallbackText = "Done.";
    } else if (!isStreaming) {
      // Tools ran but no terminal success and stream has ended.
      fallbackText = "Done — see tool calls above for details.";
    }
  }
  const displayText = text || fallbackText;

  if (isUser) {
    // Users keep the bubble — visual anchor for "this is what I said".
    return (
      <li className="flex justify-end">
        <div className="max-w-[88%] rounded-lg bg-primary px-3 py-2 text-[13px] leading-relaxed text-primary-foreground">
          <div className="whitespace-pre-wrap">{displayText}</div>
        </div>
      </li>
    );
  }

  // Assistant: no card. Just tool calls + text. The activity indicator
  // (wave spinner + rotating phrase) lives ONCE at the bottom of the
  // messages list in AgentPanel — keeping it out of the message bubble
  // prevents flickering and double-rendering as messages stream in.
  return (
    <li className="flex flex-col gap-2 py-1 text-[13px] leading-relaxed text-foreground">
      {toolCalls.length > 0 ? <ToolCallsSection toolCalls={toolCalls} /> : null}
      {displayText ? (
        <div className="prose prose-sm prose-invert max-w-none [&_pre]:my-2 [&_pre]:rounded-md [&_pre]:text-[12px] [&_code]:text-[12px] [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
          <Streamdown
            isAnimating={isStreaming}
            animated={{ animation: "blurIn", duration: 150 }}
          >
            {displayText}
          </Streamdown>
        </div>
      ) : null}
    </li>
  );
}

/**
 * Rotating shimmer text shown while the agent is working. Two phrase
 * pools:
 *   - "planning" — before the first tool call streams in (status === "submitted").
 *   - "working"  — after tools have started but no final text yet.
 * Cycles every ~3s with a fresh random pick so the same phrase doesn't
 * keep showing back-to-back. Pure CSS shimmer; no JS animation cost.
 */
const PLANNING_PHRASES = [
  "Cooking up something good…",
  "Wiring synapses…",
  "Doing the math on duration…",
  "Hyping myself up…",
  "Pretending to be creative…",
  "Reading the brief out loud…",
  "Lighting candles for inspiration…",
  "Choosing a vibe…",
  "Brewing pixels…",
  "Channeling my inner designer…",
];

const WORKING_PHRASES = [
  "Auditioning scenes…",
  "Mixing colors that don't clash…",
  "Refusing to pick TitlePopup again…",
  "Negotiating with composition #47…",
  "Picking fonts that don't suck…",
  "Trying not to use Toast…",
  "Composing your masterpiece…",
  "Pacing the beats…",
  "Avoiding the boring option…",
  "Designing on the fly…",
  "Adding more drama…",
  "Re-thinking that last choice…",
  "Almost there (probably)…",
  "Wrangling the timeline…",
  "Putting on the finishing touches…",
];

function ThinkingPhrase({ pool }: { pool: "planning" | "working" }) {
  const phrases = pool === "planning" ? PLANNING_PHRASES : WORKING_PHRASES;
  const [phrase, setPhrase] = useState(
    () => phrases[Math.floor(Math.random() * phrases.length)]!,
  );
  useEffect(() => {
    const id = setInterval(() => {
      setPhrase((prev) => {
        // Avoid showing the same phrase twice in a row.
        if (phrases.length <= 1) return prev;
        let next = prev;
        while (next === prev) {
          next = phrases[Math.floor(Math.random() * phrases.length)]!;
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [phrases]);

  return (
    <span
      className="text-[12px] font-medium text-foreground"
      style={{ animation: "agent-pulse 1.8s ease-in-out infinite" }}
    >
      {phrase}
      <style>{`
        @keyframes agent-pulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 1; }
        }
      `}</style>
    </span>
  );
}

/**
 * Walk an assistant message's UIMessage parts and pull each tool invocation
 * into the ToolCallEntry shape the section expects. AI-SDK v5 emits one
 * `tool-<name>` part per call; the part's `input`/`output` are filled in
 * progressively as the call streams in and completes.
 */
function extractToolCalls(message: ChatMessage): ToolCallEntry[] {
  const out: ToolCallEntry[] = [];
  for (const part of message.parts) {
    if (!part.type.startsWith("tool-")) continue;
    const toolName = part.type.replace(/^tool-/, "");
    const p = part as unknown as {
      input?: Record<string, unknown>;
      output?: unknown;
      toolCallId?: string;
    };
    const input = p.input ?? {};
    const meta = getToolMeta(toolName);
    out.push({
      toolName,
      toolCategory: meta.category,
      message: toolMessageFor(toolName, input),
      toolCallId: p.toolCallId,
      inputs: Object.keys(input).length > 0 ? input : undefined,
      output: p.output,
    });
  }
  return out;
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

/**
 * Walk the error.cause chain and return the deepest informative
 * message. AI-SDK and OpenAI both wrap errors in generic outer
 * messages ("Error in input stream") with the real cause nested.
 */
function humanizeAgentError(err: unknown): string {
  const visited = new Set<unknown>();
  let cur: unknown = err;
  const layers: string[] = [];
  while (cur && !visited.has(cur)) {
    visited.add(cur);
    if (cur instanceof Error) {
      if (cur.message) layers.push(cur.message);
      cur = (cur as { cause?: unknown }).cause;
    } else if (typeof cur === "string") {
      layers.push(cur);
      cur = undefined;
    } else if (cur && typeof cur === "object") {
      const obj = cur as Record<string, unknown>;
      if (typeof obj.message === "string") layers.push(obj.message);
      else if (typeof obj.error === "string") layers.push(obj.error);
      cur = obj.cause;
    } else {
      cur = undefined;
    }
  }
  if (layers.length === 0) return "Something went wrong talking to the agent.";
  // Generic outer + specific inner → prefer the inner.
  const deepest = layers[layers.length - 1]!;
  if (/input stream|stream.*error/i.test(deepest) && layers.length > 1) {
    return layers[layers.length - 2]!;
  }
  return deepest;
}
