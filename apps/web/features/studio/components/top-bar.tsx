"use client";

import type { SceneTransition } from "@workspace/compositions/transitions";
import { Button } from "@workspace/ui/components/button";
import { useRef } from "react";
import { BrandLink } from "@/components/brand-link";
import { ProjectTransitionControl } from "./project-transition-control";

type Props = {
  clipCount: number;
  totalSeconds: number;
  exporting: boolean;
  canExport: boolean;
  canSave: boolean;
  fps: number;
  projectDefaultTransition: SceneTransition | undefined;
  onUpdateProjectTransition: (transition: SceneTransition | undefined) => void;
  onExport: () => void;
  onSaveProject: () => void;
  onLoadProjectFile: (file: File) => void;
};

export function TopBar({
  clipCount,
  totalSeconds,
  exporting,
  canExport,
  canSave,
  fps,
  projectDefaultTransition,
  onUpdateProjectTransition,
  onExport,
  onSaveProject,
  onLoadProjectFile,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onLoadProjectFile(file);
    // Reset so loading the same file twice still triggers onChange.
    e.target.value = "";
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-dashed border-border bg-background/95 px-8 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-3">
        <BrandLink />
        <span className="text-muted-foreground/50">·</span>
        <span className="text-[12px] tabular-nums text-muted-foreground">
          {clipCount} clip{clipCount === 1 ? "" : "s"} ·{" "}
          {totalSeconds.toFixed(2)}s
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFileChange}
        />
        <ProjectTransitionControl
          transition={projectDefaultTransition}
          fps={fps}
          onChange={onUpdateProjectTransition}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          Import
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onSaveProject}
          disabled={!canSave}
        >
          Save
        </Button>
        <Button size="sm" onClick={onExport} disabled={exporting || !canExport}>
          {exporting ? "Rendering…" : "Export"}
        </Button>
      </div>
    </header>
  );
}
