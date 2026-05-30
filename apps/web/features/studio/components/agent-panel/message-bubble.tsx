"use client";

import type { useChat } from "@ai-sdk/react";
import { Streamdown } from "streamdown";
import {
  type ToolCallEntry,
  ToolCallsSection,
} from "@/components/agent/tool-calls-section";
import { getToolMeta, toolMessageFor } from "@/lib/agent/tool-categories";

type ChatMessage = ReturnType<typeof useChat>["messages"][number];

export function MessageBubble({
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

  const displayText = text || synthesizeFallback(toolCalls, isStreaming);

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
 * If the model never emitted final text (gpt-5-mini often skips the
 * summary turn after a build despite the prompt rule), synthesize one
 * from the last terminal tool result so the user gets closure.
 */
function synthesizeFallback(
  toolCalls: ToolCallEntry[],
  isStreaming: boolean,
): string {
  if (toolCalls.length === 0) return "";
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

  if (buildOk) {
    const clipCount =
      buildResult?.output && typeof buildResult.output === "object"
        ? Number(
            (buildResult.output as { clipsLoaded?: number }).clipsLoaded ?? 0,
          )
        : 0;
    return clipCount
      ? `Built a ${clipCount}-clip project. Tweak it from the inspector or ask me to change something.`
      : "Build complete.";
  }
  if (buildFailed) {
    const errMsg =
      buildResult?.output && typeof buildResult.output === "object"
        ? String((buildResult.output as { error?: string }).error ?? "")
        : "";
    return errMsg
      ? `Build failed: ${errMsg}`
      : "Build failed — see tool output above.";
  }

  // Surgical edit (addClip / updateClipProps / etc.) succeeded but the
  // model didn't follow up with text. Surface a generic done so the
  // shimmer hides immediately.
  const anyTerminalSuccess = toolCalls.some((c) => {
    const out = c.output;
    return (
      typeof out === "object" &&
      out !== null &&
      (out as { ok?: unknown }).ok === true
    );
  });
  if (anyTerminalSuccess) return "Done.";

  // Tools ran but no terminal success and stream has ended.
  if (!isStreaming) return "Done — see tool calls above for details.";

  return "";
}
