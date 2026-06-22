"use client";

import { Cancel01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import { Composer, type MentionItem } from "@workspace/ui/components/composer";
import { WaveSpinner } from "@workspace/ui/components/wave-spinner";
import type { UIMessage } from "ai";
import Image from "next/image";
import * as React from "react";
import { humanizeAgentError } from "@/features/studio/components/agent-panel/error";
import { MessageBubble } from "@/features/studio/components/agent-panel/message-bubble";
import { ThinkingPhrase } from "@/features/studio/components/agent-panel/thinking-phrase";

/**
 * The shared presentational shell for ALL agent chats — studio timeline agent
 * and the component-code agent both render this so they look identical. It owns
 * only layout + the message/composer rendering; each caller keeps its own
 * useChat logic (transport, tools, busy/continuation handling) and feeds the
 * results in as props.
 */
export type AgentChatProps = {
  messages: UIMessage[];
  /** Caller-computed "agent is working" flag (drives the spinner). */
  isBusy: boolean;
  /** Raw streaming flag — drives the last bubble's typing animation. */
  streaming: boolean;
  error?: Error | null;
  input: string;
  onInputChange: (value: string) => void;
  onSend: (text: string) => void;
  onStop: () => void;
  onRegenerate?: () => void;
  /** Renders a close button in the header when provided. */
  onClose?: () => void;
  subtitle?: string;
  placeholder?: string;
  /** Shown in the message area while the conversation is empty. */
  emptyState?: React.ReactNode;
  mentionItems?: MentionItem[];
  onMentionsChange?: (ids: string[]) => void;
};

export function AgentChat({
  messages,
  isBusy,
  streaming,
  error,
  input,
  onInputChange,
  onSend,
  onStop,
  onRegenerate,
  onClose,
  subtitle = "Describe it — the agent does the rest",
  placeholder,
  emptyState,
  mentionItems,
  onMentionsChange,
}: AgentChatProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const isEmpty = messages.length === 0;
  const lastMessage = messages[messages.length - 1];

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <aside className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--studio-sidebar)]">
      {/* Ambient hero — only on the empty state, then it unmounts. */}
      {isEmpty ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-72 bg-cover bg-center opacity-[0.55]"
          style={{
            backgroundImage: "url(/background.png)",
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 45%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 45%, transparent 100%)",
          }}
        />
      ) : null}

      <div
        className={`relative z-10 flex items-center justify-between border-b px-4 py-3 ${
          isEmpty
            ? "border-white/10 bg-[var(--studio-sidebar)]/30 backdrop-blur-md"
            : "border-border"
        }`}
      >
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt=""
            aria-hidden
            width={24}
            height={24}
            className="size-6 shrink-0 object-contain"
          />
          <div>
            <p className="text-sm font-medium text-foreground">Agent</p>
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {onClose ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-6"
            title="Close"
            aria-label="Close agent panel"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
          </Button>
        ) : null}
      </div>

      <div
        ref={scrollRef}
        className="relative z-10 min-h-0 flex-1 overflow-y-auto scrollbar-thin px-4 py-4"
      >
        {isEmpty ? (
          emptyState
        ) : (
          <ul className="space-y-3">
            {messages.map((m, i) => (
              <MessageBubble
                key={m.id}
                message={m}
                isStreaming={
                  streaming &&
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
                {onRegenerate ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRegenerate}
                    className="h-7 self-start"
                  >
                    <HugeiconsIcon icon={RefreshIcon} className="size-3" />
                    Retry
                  </Button>
                ) : null}
              </li>
            ) : null}
          </ul>
        )}
      </div>

      <div className="relative z-10 border-t border-border p-3">
        <Composer
          value={input}
          onChange={onInputChange}
          onSubmit={onSend}
          onStop={onStop}
          mentionItems={mentionItems}
          onMentionsChange={onMentionsChange}
          isLoading={isBusy && input.trim().length === 0}
          placeholder={
            placeholder ??
            (isBusy
              ? "Compose your next message — Stop to send now…"
              : "Describe what you want…")
          }
        />
        <p className="mt-2 text-[10px] text-muted-foreground/70">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </aside>
  );
}
