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
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { docs } from "@/lib/docs";

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
  onOpenAudio: () => void;
  onSaveProject: () => void;
  onImportProject: () => void;
};

/**
 * Global studio command palette. Press ⌘/Ctrl+K from anywhere in the
 * studio to open. Searches across:
 *   - Every registered composition (selecting one appends a new clip)
 *   - Studio actions (export, screenshot, play, save, import…)
 *   - Every docs page (selecting one navigates to it)
 *
 * Single source of truth: the composition list comes from
 * `@workspace/compositions/registry` and the docs list from `@/lib/docs`,
 * so adding a composition or doc page surfaces here automatically.
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
  onOpenAudio,
  onSaveProject,
  onImportProject,
}: Props) {
  const router = useRouter();

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
      description="Search compositions, actions, and docs"
    >
      <CommandInput placeholder="Search compositions, actions, docs…" />
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
          <CommandItem onSelect={() => run(onOpenAudio)}>
            Open audio panel
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

        <CommandGroup heading="Docs">
          {docs.map((d) => (
            <CommandItem
              key={d.slug}
              value={`docs ${d.slug} ${d.meta.title} ${d.meta.description}`}
              onSelect={() =>
                run(() => {
                  router.push(d.href);
                })
              }
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-[13px]">{d.meta.title}</span>
                <span className="line-clamp-1 text-[11px] text-muted-foreground">
                  {d.meta.description}
                </span>
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
