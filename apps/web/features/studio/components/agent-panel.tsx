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
import { WaveSpinner } from "@workspace/ui/components/wave-spinner";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { useEffect, useRef, useState } from "react";
import type { StudioAction } from "../state/reducer";
import { runClientTool } from "./agent-panel/client-tools";
import { EmptyState } from "./agent-panel/empty-state";
import { humanizeAgentError } from "./agent-panel/error";
import { MessageBubble } from "./agent-panel/message-bubble";
import { ThinkingPhrase } from "./agent-panel/thinking-phrase";

type Props = {
  project: Project;
  dispatch: React.Dispatch<StudioAction>;
  onClose: () => void;
};

// Cap on how many times the SDK will auto-continue per user message.
// Surgical edits ("add a tweet card") need: listClips → listScenesInCategory
// → getSceneDetails → addClip → updateClipProps — that's 5 tool turns
// before the terminal-tool short-circuit fires on addClip/updateClipProps.
// Set generously so multi-step edits aren't truncated mid-flow; the
// terminal-tool short-circuit ends the loop early on successful builds.
const MAX_AUTO_CONTINUATIONS_PER_USER_MESSAGE = 12;

const TERMINAL_TOOL_TYPES = new Set([
  "tool-buildProject",
  "tool-clearProject",
  "tool-addClip",
  "tool-deleteClip",
  "tool-updateClipProps",
  "tool-updateClipStyle",
  "tool-updateClipDuration",
]);

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
          if (!TERMINAL_TOOL_TYPES.has(p.type)) return false;
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

  // The ONLY reliable "the agent is done" signal is a successful
  // terminal-tool result. Text alone doesn't mean done because the
  // agent emits an opener BEFORE running tools. Stream-end (status →
  // "ready") and the 4-second forceIdle handle the other "done" cases.
  const lastMessage = messages[messages.length - 1];
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
