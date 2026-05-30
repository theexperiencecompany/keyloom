"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@workspace/ui/lib/utils";
import { useState } from "react";
import { formatToolName, getCategoryIcon } from "@/lib/agent/tool-categories";
import { CompactMarkdown } from "./compact-markdown";

export type ToolCallEntry = {
  toolName: string;
  toolCategory: string;
  message?: string;
  showCategory?: boolean;
  toolCallId?: string;
  inputs?: Record<string, unknown>;
  output?: unknown;
};

type ToolCallsSectionProps = {
  toolCalls: ToolCallEntry[];
  maxIconsToShow?: number;
  defaultExpanded?: boolean;
  className?: string;
  iconSize?: number;
};

function CategoryIcon({
  category,
  size = 16,
}: {
  category: string;
  size?: number;
}) {
  const cfg = getCategoryIcon(category);
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md p-1 backdrop-blur",
        cfg.bgClass,
      )}
    >
      <HugeiconsIcon icon={cfg.icon} size={size} className={cfg.iconClass} />
    </div>
  );
}

function Chevron({
  isExpanded,
  size = 14,
  className,
}: {
  isExpanded: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <HugeiconsIcon
      icon={ArrowDown01Icon}
      size={size}
      className={cn(
        "transition-transform duration-200",
        isExpanded && "rotate-180",
        className,
      )}
    />
  );
}

/**
 * Stacked, expandable summary of the tool calls in a single assistant
 * message. Collapsed: shows up to `maxIconsToShow` unique-category icons +
 * "Used N tools". Expanded: vertical timeline of every call with its
 * inputs/outputs available behind a per-row toggle.
 *
 * Adapted from heygaia's shadcn registry component (ui.heygaia.io/r/
 * tool-calls-section.json) — paths, icons, and category palette are
 * Motion-Studio-specific.
 */
export function ToolCallsSection({
  toolCalls,
  maxIconsToShow = 10,
  defaultExpanded = false,
  className,
  iconSize = 16,
}: ToolCallsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [expandedCalls, setExpandedCalls] = useState<Set<number>>(new Set());

  if (toolCalls.length === 0) return null;

  const toggleCall = (index: number) => {
    setExpandedCalls((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Collapsed header: one icon per unique category, rotated for a stacked
  // look. Skips repeats so a 12-tool build doesn't render 12 identical
  // chips — "12 edits" still reads as one edit icon.
  const renderStackedIcons = () => {
    const seen = new Set<string>();
    const unique = toolCalls.filter((c) => {
      const cat = c.toolCategory || "general";
      if (seen.has(cat)) return false;
      seen.add(cat);
      return true;
    });
    const display = unique.slice(0, maxIconsToShow);
    return (
      <div className="flex min-h-7 items-center -space-x-1.5">
        {display.map((call, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: tool calls are append-only; order is stable
            key={`${call.toolName}-${i}`}
            className="relative"
            style={{
              rotate:
                display.length > 1 ? (i % 2 === 0 ? "8deg" : "-8deg") : "0deg",
              zIndex: i,
            }}
          >
            <CategoryIcon category={call.toolCategory} size={iconSize} />
          </div>
        ))}
        {unique.length > maxIconsToShow && (
          <div className="z-0 flex size-7 items-center justify-center rounded-md bg-muted text-[10px] font-normal text-muted-foreground">
            +{unique.length - maxIconsToShow}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("w-full", className)}>
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center gap-2 py-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        {renderStackedIcons()}
        <span className="text-[11px] font-medium">
          Used {toolCalls.length} tool{toolCalls.length > 1 ? "s" : ""}
        </span>
        <Chevron isExpanded={isExpanded} size={12} />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="pt-2">
          {toolCalls.map((call, i) => {
            const hasCategoryText =
              call.showCategory !== false &&
              call.toolCategory &&
              call.toolCategory !== "general";
            const hasDetails =
              (call.inputs && Object.keys(call.inputs).length > 0) ||
              call.output !== undefined;
            const isOpen = expandedCalls.has(i);

            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: tool calls are append-only; order is stable
                key={`${call.toolName}-step-${i}`}
                className="flex items-stretch gap-2"
              >
                {/* Icon rail */}
                <div className="flex flex-col items-center self-stretch">
                  <CategoryIcon category={call.toolCategory} size={iconSize} />
                  {i < toolCalls.length - 1 && (
                    <div className="min-h-3 w-px flex-1 bg-border" />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 pb-2">
                  <button
                    type="button"
                    onClick={() => hasDetails && toggleCall(i)}
                    className={cn(
                      "group flex items-center gap-1 text-left",
                      hasDetails ? "cursor-pointer" : "cursor-default",
                    )}
                  >
                    <p
                      className={cn(
                        "text-[12px] font-medium text-foreground/85",
                        hasDetails &&
                          "transition-colors group-hover:text-foreground",
                      )}
                    >
                      {call.message || formatToolName(call.toolName)}
                    </p>
                    {hasDetails ? (
                      <Chevron
                        isExpanded={isOpen}
                        size={12}
                        className="text-muted-foreground"
                      />
                    ) : null}
                  </button>

                  {hasCategoryText ? (
                    <p className="text-[10px] capitalize text-muted-foreground/70">
                      {call.toolCategory.replace(/_/g, " ")}
                    </p>
                  ) : null}

                  {isOpen && hasDetails ? (
                    <div className="mt-2 space-y-2">
                      {call.inputs && Object.keys(call.inputs).length > 0 ? (
                        <div className="space-y-1">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                            Input
                          </span>
                          <CompactMarkdown content={call.inputs} />
                        </div>
                      ) : null}
                      {call.output !== undefined ? (
                        <div className="space-y-1">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                            Output
                          </span>
                          <CompactMarkdown content={call.output} />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
