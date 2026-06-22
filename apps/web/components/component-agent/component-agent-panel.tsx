"use client";

import { useChat } from "@ai-sdk/react";
import { ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { compileComponent } from "@workspace/compositions/dynamic/runtime";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import * as React from "react";

/**
 * Chat panel that edits a single forked component's CODE. The model returns the
 * full TSX via `updateComponentCode`; we compile it client-side (same runtime
 * the renderer uses) so broken code is rejected and the error is fed back for a
 * self-fix, and good code is applied live to the preview.
 */
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
  // Always send the latest code as context so successive edits build on each
  // other rather than the source the panel mounted with.
  const codeRef = React.useRef(code);
  codeRef.current = code;

  const { messages, sendMessage, status, addToolResult } = useChat({
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
  const busy = status === "submitted" || status === "streaming";

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, []);

  const send = () => {
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text }, { body: { code: codeRef.current, baseId } });
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3"
      >
        {messages.length === 0 ? (
          <p className="px-1 pt-2 text-xs leading-relaxed text-muted-foreground">
            Ask for a change to this component — e.g. “move the avatar to the
            right”, “make the title bigger”, “use a blue gradient background”.
            The preview updates when the edit compiles.
          </p>
        ) : (
          messages.map((m) => <AgentMessage key={m.id} message={m} />)
        )}
        {busy ? (
          <p className="px-1 text-xs text-muted-foreground">Thinking…</p>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-border p-2">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Describe a change…"
            rows={2}
            className="min-h-0 resize-none"
          />
          <Button
            size="icon"
            onClick={send}
            disabled={!input.trim() || busy}
            aria-label="Send"
          >
            <HugeiconsIcon icon={ArrowUp01Icon} size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AgentMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
  const editedOk = message.parts.some(
    (p) =>
      p.type === "tool-updateComponentCode" &&
      (p as { output?: { ok?: boolean } }).output?.ok === true,
  );

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
            : "max-w-[90%] space-y-1.5 text-sm"
        }
      >
        {text ? <p className="whitespace-pre-wrap">{text}</p> : null}
        {editedOk ? (
          <p className="text-xs font-medium text-emerald-500">
            ✓ Component updated
          </p>
        ) : null}
      </div>
    </div>
  );
}
