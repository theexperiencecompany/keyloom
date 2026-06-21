"use client";

import {
  ArrowDown01Icon,
  ComputerIcon,
  SmartPhone01Icon,
  SquareIcon,
  Tablet01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { SceneTransition } from "@workspace/compositions/transitions";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useEffect, useRef, useState } from "react";
import { BrandLink } from "@/components/brand-link";
import { ProjectTransitionControl } from "./project-transition-control";

/**
 * Canvas formats the studio stage/export can switch between. All are based on a
 * 1080p short edge so the export stays Full-HD-class in every orientation. The
 * preview Player and the MP4 export both read project.width/height, so picking
 * one here reshapes both — letting a portrait composition (e.g. Message
 * Bubbles, 9:16) fill the frame instead of being cropped by the 16:9 stage.
 */
const PROJECT_FORMATS = [
  {
    id: "16:9",
    label: "16:9 · Landscape",
    width: 1920,
    height: 1080,
    icon: ComputerIcon,
  },
  {
    id: "1:1",
    label: "1:1 · Square",
    width: 1080,
    height: 1080,
    icon: SquareIcon,
  },
  {
    id: "9:16",
    label: "9:16 · Portrait",
    width: 1080,
    height: 1920,
    icon: SmartPhone01Icon,
  },
  {
    id: "4:5",
    label: "4:5 · Portrait",
    width: 1080,
    height: 1350,
    icon: Tablet01Icon,
  },
] as const;

type Props = {
  projectName: string | undefined;
  onRenameProject: (name: string) => void;
  exporting: boolean;
  canExport: boolean;
  canSave: boolean;
  fps: number;
  width: number;
  height: number;
  onChangeFormat: (width: number, height: number) => void;
  projectDefaultTransition: SceneTransition | undefined;
  onUpdateProjectTransition: (transition: SceneTransition | undefined) => void;
  onExport: () => void;
  onSaveProject: () => void;
  onLoadProjectFile: (file: File) => void;
};

export function TopBar({
  projectName,
  onRenameProject,
  exporting,
  canExport,
  canSave,
  width,
  height,
  onChangeFormat,
  projectDefaultTransition,
  fps,
  onUpdateProjectTransition,
  onExport,
  onSaveProject,
  onLoadProjectFile,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeFormat = PROJECT_FORMATS.find(
    (f) => f.width === width && f.height === height,
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onLoadProjectFile(file);
    // Reset so loading the same file twice still triggers onChange.
    e.target.value = "";
  }

  return (
    <header className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border bg-[var(--studio-sidebar)] px-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Left: identity (brand + editable title) and the File menu. */}
      <div className="flex min-w-0 items-center gap-1">
        <BrandLink />
        <span className="mx-1 h-5 w-px shrink-0 bg-border" />
        <EditableTitle name={projectName} onRename={onRenameProject} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 px-2 text-muted-foreground"
            >
              File
              <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
              Import project…
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onSaveProject} disabled={!canSave}>
              Save project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Center: a single labelled format control (replaces the icon row). */}
      <div className="justify-self-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {activeFormat && (
                <HugeiconsIcon icon={activeFormat.icon} className="size-4" />
              )}
              <span className="text-[13px] tabular-nums">
                {activeFormat?.id ?? `${width}×${height}`}
              </span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                className="size-3.5 text-muted-foreground"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-52">
            {PROJECT_FORMATS.map((f) => {
              const active = f.width === width && f.height === height;
              return (
                <DropdownMenuItem
                  key={f.id}
                  onSelect={() => onChangeFormat(f.width, f.height)}
                  className="gap-2"
                >
                  <HugeiconsIcon icon={f.icon} className="size-4" />
                  <span className="flex-1">{f.label}</span>
                  {active && (
                    <HugeiconsIcon icon={Tick02Icon} className="size-3.5" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right: quiet motion control + the single primary CTA. */}
      <div className="flex items-center justify-self-end gap-2">
        <ProjectTransitionControl
          transition={projectDefaultTransition}
          fps={fps}
          onChange={onUpdateProjectTransition}
        />
        <span className="h-5 w-px bg-border" />
        <Button size="sm" onClick={onExport} disabled={exporting || !canExport}>
          {exporting ? "Rendering…" : "Export"}
        </Button>
      </div>
    </header>
  );
}

/**
 * Inline-editable project title — the document focal point. Commits on blur or
 * Enter; Escape reverts. Renders a placeholder when unnamed.
 */
function EditableTitle({
  name,
  onRename,
}: {
  name: string | undefined;
  onRename: (name: string) => void;
}) {
  const [value, setValue] = useState(name ?? "");
  useEffect(() => setValue(name ?? ""), [name]);

  function commit() {
    onRename(value.trim());
  }

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setValue(name ?? "");
          e.currentTarget.blur();
        }
      }}
      placeholder="Untitled video"
      spellCheck={false}
      aria-label="Project name"
      className="min-w-0 max-w-[220px] rounded-md bg-transparent px-2 py-1 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 hover:bg-muted focus:bg-muted focus:ring-1 focus:ring-ring/40"
    />
  );
}
