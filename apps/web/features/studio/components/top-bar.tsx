"use client";

import {
  Download01Icon,
  FileUploadIcon,
  SaveIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { useRef } from "react";
import { BrandLink } from "@/components/brand-link";

type Props = {
  clipCount: number;
  totalSeconds: number;
  exporting: boolean;
  canExport: boolean;
  canSave: boolean;
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
      <TooltipProvider>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileChange}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <HugeiconsIcon icon={FileUploadIcon} size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open project (.json)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onSaveProject}
                disabled={!canSave}
              >
                <HugeiconsIcon icon={SaveIcon} size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save project (.json)</TooltipContent>
          </Tooltip>
          <Button
            size="sm"
            onClick={onExport}
            disabled={exporting || !canExport}
          >
            <HugeiconsIcon icon={Download01Icon} size={14} />
            {exporting ? "Rendering…" : "Export"}
          </Button>
        </div>
      </TooltipProvider>
    </header>
  );
}
