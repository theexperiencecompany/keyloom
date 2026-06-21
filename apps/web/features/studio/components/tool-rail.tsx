"use client";

import {
  FolderLibraryIcon,
  SparklesIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@workspace/ui/lib/utils";
import type { StudioPanel } from "../state/reducer";

type IconType = typeof FolderLibraryIcon;

type Props = {
  openPanel: StudioPanel;
  onToggle: (panel: StudioPanel) => void;
};

export function ToolRail({ openPanel, onToggle }: Props) {
  return (
    <aside className="flex w-[72px] shrink-0 flex-col items-stretch gap-2 border-r border-border bg-background px-2 py-3">
      <ToolButton
        active={openPanel === "library"}
        onClick={() => onToggle("library")}
        label="Library"
        icon={FolderLibraryIcon}
      />
      <ToolButton
        active={openPanel === "upload"}
        onClick={() => onToggle("upload")}
        label="Upload"
        icon={Upload01Icon}
      />
      <ToolButton
        active={openPanel === "agent"}
        onClick={() => onToggle("agent")}
        label="Agent"
        icon={SparklesIcon}
      />
    </aside>
  );
}

function ToolButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: IconType;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-pressed={active}
      className={cn(
        "flex w-full flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium leading-none transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {/* Free HugeIcons ship stroke-only, so we emphasize the active tool with a
          heavier stroke (closest to Canva's stroke→fill swap). */}
      <HugeiconsIcon
        icon={icon}
        className="size-[18px]"
        strokeWidth={active ? 2.5 : 1.8}
      />
      <span>{label}</span>
    </button>
  );
}
