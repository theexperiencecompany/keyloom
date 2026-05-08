"use client";

import {
  Cancel01Icon,
  MultiplicationSignIcon,
  PlusSignIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Player } from "@remotion/player";
import { componentsById } from "@workspace/compositions/components";
import { compositions } from "@workspace/compositions/registry";
import type { AnyCompositionInfo } from "@workspace/compositions/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { useState } from "react";

type Props = {
  onAdd: (compositionId: string) => void;
  onClose: () => void;
};

export function LibraryPanel({ onAdd, onClose }: Props) {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const textAnimations = compositions.filter(
    (c) => c.id.startsWith("Title") || c.id.startsWith("Text"),
  );
  const others = compositions.filter(
    (c) => !c.id.startsWith("Title") && !c.id.startsWith("Text"),
  );

  const searchResults = normalizedQuery
    ? compositions.filter(
        (c) =>
          c.title.toLowerCase().includes(normalizedQuery) ||
          c.description.toLowerCase().includes(normalizedQuery),
      )
    : null;

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-r border-border bg-background">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
          <div>
            <p className="text-sm font-medium text-foreground">Library</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Click to add a scene
            </p>
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

        <div className="px-3 py-2">
          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search components..."
              className="h-8 rounded-md pl-8 text-xs"
              style={{ paddingRight: query ? "2rem" : undefined }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none"
                aria-label="Clear search"
              >
                <HugeiconsIcon
                  icon={MultiplicationSignIcon}
                  className="size-3"
                />
              </button>
            )}
          </div>
        </div>

        {searchResults !== null ? (
          <div className="px-3 pb-3">
            {searchResults.length === 0 ? (
              <p className="px-1 py-4 text-center text-xs text-muted-foreground">
                No components match &ldquo;{query.trim()}&rdquo;
              </p>
            ) : (
              <ul className="space-y-px">
                {searchResults.map((c) => (
                  <li key={c.id}>
                    <PreviewTooltipItem info={c} onAdd={onAdd} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={["text", "templates"]}
            className="rounded-none border-none px-3"
          >
            <AccordionSection
              value="text"
              title="Text"
              items={textAnimations}
              onAdd={onAdd}
            />
            <AccordionSection
              value="templates"
              title="Templates"
              items={others}
              onAdd={onAdd}
            />
          </Accordion>
        )}
      </aside>
    </TooltipProvider>
  );
}

function AccordionSection({
  value,
  title,
  items,
  onAdd,
}: {
  value: string;
  title: string;
  items: typeof compositions;
  onAdd: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <AccordionItem
      value={value}
      className="border-border/60 data-open:bg-transparent"
    >
      <AccordionTrigger className="px-1 py-2 text-xs hover:no-underline">
        {title}
      </AccordionTrigger>
      <AccordionContent className="px-0 pb-0">
        <ul className="space-y-px">
          {items.map((c) => (
            <li key={c.id}>
              <PreviewTooltipItem info={c} onAdd={onAdd} />
            </li>
          ))}
        </ul>
      </AccordionContent>
    </AccordionItem>
  );
}

function PreviewTooltipItem({
  info,
  onAdd,
}: {
  info: AnyCompositionInfo;
  onAdd: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const Component = componentsById[info.id];

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          onClick={() => onAdd(info.id)}
          className="group h-auto w-full justify-start gap-2 rounded-lg px-2.5 py-1.5 text-left"
        >
          <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/80 group-hover:text-foreground">
            {info.title}
          </span>
          <span className="flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all group-hover:bg-accent group-hover:text-foreground group-hover:opacity-100">
            <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
          </span>
        </Button>
      </TooltipTrigger>
      {open && Component && (
        <TooltipContent
          side="right"
          sideOffset={12}
          hideArrow
          className="block w-72 max-w-none overflow-hidden border border-border bg-background p-0 shadow-xl"
        >
          <div className="w-72">
            <div
              className="w-full overflow-hidden"
              style={{ aspectRatio: `${info.width} / ${info.height}` }}
            >
              <Player
                component={Component}
                inputProps={info.defaultProps}
                durationInFrames={info.durationInFrames}
                fps={info.fps}
                compositionWidth={info.width}
                compositionHeight={info.height}
                style={{ width: "100%", height: "100%" }}
                autoPlay
                loop
                initiallyMuted
                acknowledgeRemotionLicense
              />
            </div>
            <div className="px-3 py-2">
              <p className="text-[11px] text-muted-foreground">
                {info.description}
              </p>
            </div>
          </div>
        </TooltipContent>
      )}
    </Tooltip>
  );
}
