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
import { useTheme } from "next-themes";
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

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {/* Sun icon (shown in dark mode) */}
          <svg
            viewBox="0 0 24 24"
            className="size-4 hidden dark:block"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <title>Sun</title>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
          {/* Moon icon (shown in light mode) */}
          <svg
            viewBox="0 0 24 24"
            className="size-4 block dark:hidden"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <title>Moon</title>
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Toggle theme</TooltipContent>
    </Tooltip>
  );
}

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
          <ThemeToggle />
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
