"use client";

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { FieldsRenderer } from "@workspace/compositions/editors";
import { type Project, projectDuration } from "@workspace/compositions/project";
import { compositionsById } from "@workspace/compositions/registry";
import { Button } from "@workspace/ui/components/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import dynamic from "next/dynamic";
import Link from "next/link";
import * as React from "react";
import { ComponentAgentPanel } from "@/components/component-agent/component-agent-panel";
import { useForceDarkTheme } from "@/features/studio/hooks/use-force-dark-theme";
import {
  getUserComponent,
  type UserComponent,
  updateUserComponent,
} from "@/lib/user-components";

const EditorPreview = dynamic(
  () => import("./editor-preview").then((m) => m.EditorPreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
        Loading preview…
      </div>
    ),
  },
);

export function ForkEditorView({ id }: { id: string }) {
  // Same dark editor surface as the studio.
  useForceDarkTheme();

  const [fork, setFork] = React.useState<UserComponent | null | undefined>(
    undefined,
  );
  const [code, setCode] = React.useState("");
  const [props, setProps] = React.useState<Record<string, unknown>>({});
  const [name, setName] = React.useState("");

  // Load the fork from the DB after mount.
  React.useEffect(() => {
    let active = true;
    getUserComponent(id).then((f) => {
      if (!active) return;
      setFork(f);
      if (f) {
        setCode(f.code);
        setName(f.name);
        const base = compositionsById[f.baseId];
        setProps(
          structuredClone(base?.defaultProps ?? {}) as Record<string, unknown>,
        );
      }
    });
    return () => {
      active = false;
    };
  }, [id]);

  // Rename the fork — persists on blur / Enter, never to an empty name.
  const commitName = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === fork?.name) {
      setName(fork?.name ?? "");
      return;
    }
    setFork((prev) => (prev ? { ...prev, name: trimmed } : prev));
    void updateUserComponent(id, { name: trimmed });
  };

  const applyCode = React.useCallback(
    (next: string) => {
      setCode(next);
      setFork((prev) => (prev ? { ...prev, code: next } : prev));
      // Persist to the DB (fire-and-forget — the editor state is the source of
      // truth while open).
      void updateUserComponent(id, { code: next });
    },
    [id],
  );

  const base = fork ? compositionsById[fork.baseId] : undefined;

  const project: Project | null = React.useMemo(() => {
    if (!fork) return null;
    return {
      name: fork.name,
      fps: base?.fps ?? 60,
      width: base?.width ?? 1920,
      height: base?.height ?? 1080,
      clips: [
        {
          id: fork.id,
          compositionId: fork.id,
          props,
          durationInFrames: base?.durationInFrames ?? 150,
        },
      ],
      customComponents: {
        [fork.id]: {
          baseId: fork.baseId,
          name: fork.name,
          code,
          ...(fork.exportName ? { exportName: fork.exportName } : {}),
        },
      },
    };
  }, [fork, base, props, code]);

  const totalDuration = React.useMemo(
    () => (project ? projectDuration(project) : 1),
    [project],
  );

  if (fork === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (fork === null || !project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm font-medium">Component not found</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          This forked component isn’t in your library on this browser.
        </p>
        <Button asChild>
          <Link href="/dashboard/projects">Back to My Projects</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="studio-shell flex h-screen flex-col bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <Link
          href="/dashboard/projects"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          My Projects
        </Link>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setName(fork.name);
              e.currentTarget.blur();
            }
          }}
          aria-label="Component name"
          className="max-w-[260px] truncate rounded-md border border-transparent bg-transparent px-2 py-1 text-center text-sm font-medium outline-none hover:border-border focus:border-border focus:bg-background"
        />
        <div className="w-[90px]" />
      </header>

      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        {/* Agent (left) — same chat UI as the studio agent */}
        <ResizablePanel
          id="ce-agent"
          defaultSize="360px"
          minSize="300px"
          maxSize="560px"
        >
          <ComponentAgentPanel
            code={code}
            baseId={fork.baseId}
            exportName={fork.exportName ?? undefined}
            onApply={applyCode}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Preview (center) */}
        <ResizablePanel id="ce-preview" minSize="400px">
          <div className="flex h-full items-center justify-center bg-muted/20 p-4">
            <div
              className="max-h-full w-full max-w-[1200px] overflow-hidden rounded-lg border border-border bg-background shadow-sm"
              style={{ aspectRatio: `${project.width} / ${project.height}` }}
            >
              <EditorPreview
                project={project}
                totalDuration={totalDuration}
                width={project.width}
                height={project.height}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Properties (right) — same edit panel as the studio inspector */}
        <ResizablePanel
          id="ce-props"
          defaultSize="320px"
          minSize="260px"
          maxSize="520px"
        >
          <aside className="flex h-full flex-col overflow-hidden bg-card">
            <div className="border-b border-border px-4 py-2 text-[11px] font-medium text-muted-foreground">
              Properties
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <FieldsRenderer
                fields={base?.fields ?? []}
                value={props}
                onChange={setProps}
              />
            </div>
          </aside>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
