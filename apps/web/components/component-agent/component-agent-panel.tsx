"use client";

import { useChat } from "@ai-sdk/react";
import { compileComponent } from "@workspace/compositions/dynamic/runtime";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import * as React from "react";
import { AgentChat } from "@/components/agent/agent-chat";

// Same chat UI as the studio agent (via the shared <AgentChat>), pointed at the
// component-editing endpoint. The model returns full TSX via
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

  // Bounds the self-fix loop: after a tool call we only auto-continue to let
  // the model FIX a compile error, never after a successful edit. Reset on each
  // user message.
  const autoContinue = React.useRef(0);
  const MAX_AUTO_CONTINUE = 3;

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
    sendAutomaticallyWhen: (args) => {
      if (!lastAssistantMessageIsCompleteWithToolCalls(args)) return false;
      const last = args.messages[args.messages.length - 1];
      if (!last || last.role !== "assistant") return false;
      // A successful edit is terminal — stop so the agent doesn't loop
      // re-editing the component forever.
      const succeeded = last.parts.some(
        (p) =>
          p.type === "tool-updateComponentCode" &&
          (p as { output?: { ok?: boolean } }).output?.ok === true,
      );
      if (succeeded) return false;
      // The tool errored (or no edit yet) — allow a bounded number of
      // continuations so the model can correct the compile error.
      if (autoContinue.current >= MAX_AUTO_CONTINUE) return false;
      autoContinue.current += 1;
      return true;
    },
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
  const isBusy = status === "submitted" || status === "streaming";

  const send = async (text: string) => {
    const value = text.trim();
    if (!value) return;
    if (isBusy) await stop();
    autoContinue.current = 0;
    sendMessage({ text: value }, { body: { code: codeRef.current, baseId } });
    setInput("");
  };

  return (
    <AgentChat
      messages={messages}
      isBusy={isBusy}
      streaming={status === "streaming"}
      error={error}
      input={input}
      onInputChange={setInput}
      onSend={send}
      onStop={() => stop()}
      onRegenerate={() => regenerate()}
      subtitle="Describe a change — it edits this component"
      placeholder="Describe a change…"
      emptyState={
        <p className="relative z-10 text-[12px] leading-relaxed text-muted-foreground">
          Ask for a change to this component — e.g. “move the avatar to the
          right”, “make the title bigger”, “use a blue gradient background”. The
          preview updates the moment the edit compiles.
        </p>
      }
    />
  );
}
