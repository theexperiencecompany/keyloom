"use client";

import { useChat } from "@ai-sdk/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { compileComponent } from "@workspace/compositions/dynamic/runtime";
import { Button } from "@workspace/ui/components/button";
import { Composer } from "@workspace/ui/components/composer";
import { WaveSpinner } from "@workspace/ui/components/wave-spinner";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import * as React from "react";
import { humanizeAgentError } from "@/features/studio/components/agent-panel/error";
import { MessageBubble } from "@/features/studio/components/agent-panel/message-bubble";
import { ThinkingPhrase } from "@/features/studio/components/agent-panel/thinking-phrase";

// Same chat UI as the studio agent (MessageBubble / Composer / WaveSpinner),
// pointed at the component-editing endpoint. The model returns full TSX via
// `updateComponentCode`; we compile it client-side (the same runtime the
// renderer uses) so broken code is rejected and the error fed back for a
// self-fix, and good code is applied live to the preview.
const transport = new DefaultChatTransport({ api: "/api/component-chat" });

export function ComponentAgentPanel({
  code,
  baseId,
  exportName,
  onApply,
}: {
  code: string;
  baseId: string;
  exportName?: string;
  onApply: (code: string) => void;
}) {
  // Always send the latest code so successive edits build on each other.
  const codeRef = React.useRef(code);
  codeRef.current = code;

  const {
    messages,
    sendMessage,
    status,
    addToolResult,
    stop,
    error,
    regenerate,
  } = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: async ({ toolCall }) => {
      if (toolCall.toolName !== "updateComponentCode") return;
      const next = (toolCall.input as { code?: string }).code ?? "";
      const compiled = compileComponent(next, exportName ?? baseId);
      if (compiled.error) {
        await addToolResult({
          tool: "updateComponentCode" as never,
          toolCallId: toolCall.toolCallId,
          output: { ok: false, error: compiled.error } as never,
        });
        return;
      }
      onApply(next);
      await addToolResult({
        tool: "updateComponentCode" as never,
        toolCallId: toolCall.toolCallId,
        output: { ok: true } as never,
      });
    },
  });

  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const isBusy = status === "submitted" || status === "streaming";
  const lastMessage = messages[messages.length - 1];

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || isBusy) return;
    sendMessage({ text: value }, { body: { code: codeRef.current, baseId } });
    setInput("");
  };

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden bg-card">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-4 py-4"
      >
        {messages.length === 0 ? (
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Ask for a change to this component — e.g. “move the avatar to the
            right”, “make the title bigger”, “use a blue gradient background”.
            The preview updates the moment the edit compiles.
          </p>
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
            {isBusy ? (
              <li
                className="flex items-center gap-2.5 py-1"
                role="status"
                aria-live="polite"
              >
                <WaveSpinner
                  size="md"
                  pattern="line"
                  dotShape="circle"
                  animation="horizontal"
                  color="primary"
                />
                <ThinkingPhrase
                  pool={
                    lastMessage?.role === "assistant" ? "working" : "planning"
                  }
                />
              </li>
            ) : null}
            {error ? (
              <li
                role="alert"
                className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive"
              >
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

      <div className="border-t border-border p-3">
        <Composer
          value={input}
          onChange={setInput}
          onSubmit={(text) => send(text)}
          onStop={() => stop()}
          isLoading={isBusy && input.trim().length === 0}
          placeholder={
            isBusy
              ? "Compose your next message — Stop to send now…"
              : "Describe a change…"
          }
        />
        <p className="mt-2 text-[10px] text-muted-foreground/70">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </aside>
  );
}
