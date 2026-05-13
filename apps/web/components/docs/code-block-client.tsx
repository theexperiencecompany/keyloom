"use client";

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Download01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import * as React from "react";

type Tab = {
  label: string;
  path: string;
  source: string;
};

type Props = {
  tabs: Tab[];
  downloadBaseName: string;
};

const COLLAPSED_MAX_HEIGHT = 360;

export function CodeBlockClient({ tabs, downloadBaseName }: Props) {
  const [active, setActive] = React.useState(tabs[0]?.label ?? "");
  const [copied, setCopied] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  if (tabs.length === 0) return null;
  const current = tabs.find((t) => t.label === active) ?? tabs[0]!;

  function handleCopy() {
    navigator.clipboard
      .writeText(current.source)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      })
      .catch((err) => {
        console.error("Failed to copy to clipboard", err);
      });
  }

  function handleDownload() {
    const blob = new Blob([current.source], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = current.label;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-border bg-muted/30">
      <Tabs value={active} onValueChange={setActive}>
        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-2 py-1.5">
          <TabsList className="bg-transparent p-0 h-auto gap-0.5">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.label}
                value={tab.label}
                className="data-[state=active]:bg-background data-[state=active]:shadow-none rounded-md px-2.5 py-1 text-[12px] font-medium font-mono"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDownload}
              title={`Download ${current.label}`}
              aria-label="Download"
            >
              <HugeiconsIcon icon={Download01Icon} size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
              title="Copy code"
              aria-label="Copy code"
            >
              <HugeiconsIcon
                icon={copied ? CheckmarkCircle02Icon : Copy01Icon}
                size={14}
                className={copied ? "text-emerald-400" : ""}
              />
            </Button>
          </div>
        </div>
        {tabs.map((tab) => (
          <TabsContent key={tab.label} value={tab.label} className="m-0">
            <div
              className="relative"
              style={{
                maxHeight: expanded ? "none" : COLLAPSED_MAX_HEIGHT,
                overflow: "hidden",
              }}
            >
              <pre className="m-0 overflow-x-auto bg-transparent p-4 text-[12.5px] leading-relaxed font-mono">
                <code className="text-foreground">{tab.source}</code>
              </pre>
              {!expanded && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-muted/95 via-muted/70 to-transparent"
                />
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      <div className="flex items-center justify-between gap-2 border-t border-border bg-background/40 px-2 py-1.5">
        <span className="px-2 text-[10px] font-mono text-muted-foreground">
          Save as{" "}
          <span className="text-foreground">
            {downloadBaseName}/{current.label}
          </span>{" "}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          className="h-7 gap-1.5 text-[11px] font-medium"
        >
          <HugeiconsIcon
            icon={expanded ? ArrowUp01Icon : ArrowDown01Icon}
            size={13}
          />
          {expanded ? "Hide code" : "View code"}
        </Button>
      </div>
    </div>
  );
}
