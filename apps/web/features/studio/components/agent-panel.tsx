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
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
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

export function AgentPanel({ project, dispatch, onClose }: Props) {
  // Keep the latest project in a ref so onToolCall (closed over at mount)
  // always sees current clips/ids instead of a stale snapshot.
  const projectRef = useRef(project);
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    regenerate,
    addToolResult,
  } = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
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

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
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
            {messages.map((m, i) => (
              <MessageBubble
                key={m.id}
                message={m}
                isStreaming={
                  status === "streaming" &&
                  i === messages.length - 1 &&
                  m.role === "assistant"
                }
              />
            ))}
            {status === "submitted" ? (
              <li className="flex justify-start">
                <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
                  Thinking…
                </div>
              </li>
            ) : null}
            {error ? (
              <li className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive">
                <span>
                  {error.message ??
                    "Something went wrong talking to the agent."}
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
            placeholder="Describe the video you want…"
            rows={1}
            disabled={isBusy}
            className="min-h-0 flex-1 resize-none border-0 bg-transparent p-1 text-[13px] focus-visible:ring-0 focus-visible:outline-none disabled:cursor-not-allowed"
          />
          {isBusy ? (
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
              title="Send"
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
      dispatch({ type: "LOAD_PROJECT", project: parsed.project });
      return {
        ok: true,
        clipsLoaded: parsed.project.clips.length,
        warnings: parsed.warnings,
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
    // Server-executed tools (listScenesInCategory, getSceneDetails) come
    // through onToolCall too, but their result is already produced
    // upstream — returning undefined tells the caller to skip addToolResult.
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
  isStreaming: boolean;
}) {
  const isUser = message.role === "user";
  const text = message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
  const toolCalls = isUser ? [] : extractToolCalls(message);

  return (
    <li className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] space-y-2 rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-muted/40 text-foreground"
        }`}
      >
        {toolCalls.length > 0 ? (
          <ToolCallsSection toolCalls={toolCalls} />
        ) : null}
        {text ? (
          isUser ? (
            <div className="whitespace-pre-wrap">{text}</div>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none [&_pre]:my-2 [&_pre]:rounded-md [&_pre]:text-[12px] [&_code]:text-[12px] [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
              <Streamdown
                isAnimating={isStreaming}
                animated={{ animation: "blurIn", duration: 150 }}
              >
                {text}
              </Streamdown>
            </div>
          )
        ) : null}
      </div>
    </li>
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
