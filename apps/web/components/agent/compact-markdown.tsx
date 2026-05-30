"use client";

import { cn } from "@workspace/ui/lib/utils";

export interface CompactMarkdownProps {
  content: unknown;
  className?: string;
}

function isStructured(value: unknown): boolean {
  if (typeof value === "object" && value !== null) return true;
  if (typeof value === "string") {
    const t = value.trim();
    return (
      (t.startsWith("{") && t.endsWith("}")) ||
      (t.startsWith("[") && t.endsWith("]"))
    );
  }
  return false;
}

function tryPrettyJson(s: string): string {
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}

/**
 * Compact preview for tool-call inputs/outputs inside the agent panel.
 * - Objects/arrays → pretty-printed JSON inside a scroll-capped pre.
 * - JSON-looking strings → same treatment after parse.
 * - Plain strings → wrapped text.
 */
export function CompactMarkdown({ content, className }: CompactMarkdownProps) {
  const base =
    "rounded-md bg-muted/40 border border-border/40 p-2 text-[11px] text-muted-foreground max-h-48 overflow-y-auto w-full max-w-full";

  if (isStructured(content)) {
    const display =
      typeof content === "string"
        ? tryPrettyJson(content)
        : JSON.stringify(content, null, 2);
    return (
      <pre
        className={cn(
          base,
          "whitespace-pre-wrap break-words font-mono leading-relaxed",
          className,
        )}
      >
        {display}
      </pre>
    );
  }

  return (
    <div className={cn(base, "leading-relaxed", className)}>
      {String(content ?? "")}
    </div>
  );
}
