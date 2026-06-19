"use client";

import { compositions } from "@workspace/compositions/registry";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Actions invoked when the user picks an item. The palette closes itself. */
  onAddComposition: (compositionId: string) => void;
  onExport: () => void;
  onScreenshot: () => void;
  onTogglePlay: () => void;
  onSkipToStart: () => void;
  onSkipToEnd: () => void;
  onOpenLibrary: () => void;
  onOpenUpload: () => void;
  onSaveProject: () => void;
  onImportProject: () => void;
};

/**
 * Global studio command palette. Press ⌘/Ctrl+K from anywhere in the
 * studio to open. Searches across:
 *   - Every registered composition (selecting one appends a new clip)
 *   - Studio actions (export, screenshot, play, save, import…)
 *
 * Single source of truth: the composition list comes from
 * `@workspace/compositions/registry`, so adding a composition surfaces here
 * automatically.
 */
export function CommandPalette({
  open,
  onOpenChange,
  onAddComposition,
  onExport,
  onScreenshot,
  onTogglePlay,
  onSkipToStart,
  onSkipToEnd,
  onOpenLibrary,
  onOpenUpload,
  onSaveProject,
  onImportProject,
}: Props) {
  // ⌘K / Ctrl+K toggles the palette from anywhere in the studio.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  function run(fn: () => void) {
    onOpenChange(false);
    // Defer so the dialog closes cleanly before the action's side effects.
    queueMicrotask(fn);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Studio commands"
      description="Search compositions and actions"
    >
      <CommandInput placeholder="Search compositions, actions…" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(onExport)}>
            Export video…
          </CommandItem>
          <CommandItem onSelect={() => run(onScreenshot)}>
            Screenshot current frame
          </CommandItem>
          <CommandItem onSelect={() => run(onTogglePlay)}>
            Play / pause
          </CommandItem>
          <CommandItem onSelect={() => run(onSkipToStart)}>
            Skip to start
          </CommandItem>
          <CommandItem onSelect={() => run(onSkipToEnd)}>
            Skip to end
          </CommandItem>
          <CommandItem onSelect={() => run(onOpenLibrary)}>
            Open library panel
          </CommandItem>
          <CommandItem onSelect={() => run(onOpenUpload)}>
            Open upload panel
          </CommandItem>
          <CommandItem onSelect={() => run(onSaveProject)}>
            Save project (JSON)
          </CommandItem>
          <CommandItem onSelect={() => run(onImportProject)}>
            Import project / template…
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Add composition">
          {compositions.map((c) => (
            <CommandItem
              key={c.id}
              value={`add ${c.id} ${c.title} ${c.description ?? ""}`}
              onSelect={() => run(() => onAddComposition(c.id))}
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-[13px]">{c.title}</span>
                {c.description ? (
                  <span className="line-clamp-1 text-[11px] text-muted-foreground">
                    {c.description}
                  </span>
                ) : null}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
