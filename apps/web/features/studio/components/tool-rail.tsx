"use client";

import { FolderLibraryIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import type { StudioPanel } from "../state/reducer";

type Props = {
  openPanel: StudioPanel;
  onToggle: (panel: StudioPanel) => void;
};

export function ToolRail({ openPanel, onToggle }: Props) {
  return (
    <aside className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-background py-3">
      <ToolButton
        active={openPanel === "library"}
        onClick={() => onToggle("library")}
        label="Library"
      >
        <HugeiconsIcon icon={FolderLibraryIcon} className="size-5" />
      </ToolButton>
    </aside>
  );
}

function ToolButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Button
        variant={active ? "secondary" : "ghost"}
        size="icon"
        onClick={onClick}
        title={label}
        className={
          active ? "text-primary bg-primary/10 hover:bg-primary/15" : ""
        }
      >
        {children}
      </Button>
      {active && (
        <span className="absolute -left-3 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r bg-primary" />
      )}
    </div>
  );
}
