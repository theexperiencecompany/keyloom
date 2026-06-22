"use client";

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { FieldsRenderer } from "@workspace/compositions/editors";
import { type Project, projectDuration } from "@workspace/compositions/project";
import { compositionsById } from "@workspace/compositions/registry";
import { Button } from "@workspace/ui/components/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { Textarea } from "@workspace/ui/components/textarea";
import dynamic from "next/dynamic";
import Link from "next/link";
import * as React from "react";
import { ComponentAgentPanel } from "@/components/component-agent/component-agent-panel";
import {
  getUserComponent,
  saveUserComponent,
  type UserComponent,
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
  const [fork, setFork] = React.useState<UserComponent | null | undefined>(
    undefined,
  );
  const [code, setCode] = React.useState("");
  const [props, setProps] = React.useState<Record<string, unknown>>({});

  // localStorage is client-only — load after mount.
  React.useEffect(() => {
    const f = getUserComponent(id);
    setFork(f ?? null);
    if (f) {
      setCode(f.code);
      const base = compositionsById[f.baseId];
      setProps(
        structuredClone(base?.defaultProps ?? {}) as Record<string, unknown>,
      );
    }
  }, [id]);

  const applyCode = React.useCallback((next: string) => {
    setCode(next);
    setFork((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, code: next, updatedAt: Date.now() };
      saveUserComponent(updated);
      return updated;
    });
  }, []);

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
    <div className="flex min-h-screen flex-col lg:h-screen">
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
        <Link
          href="/dashboard/projects"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          My Projects
        </Link>
        <h1 className="text-sm font-medium">{fork.name}</h1>
        <div className="w-[90px]" />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[300px_1fr_400px]">
        {/* Props panel */}
        <aside className="flex flex-col overflow-y-auto border-b border-border lg:border-b-0 lg:border-r">
          <div className="border-b border-border px-4 py-2 text-[11px] font-medium text-muted-foreground">
            Properties
          </div>
          <FieldsRenderer
            fields={base?.fields ?? []}
            value={props}
            onChange={setProps}
          />
        </aside>

        {/* Preview */}
        <div className="flex items-center justify-center bg-muted/20 p-4 lg:min-h-0">
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

        {/* Code + Agent */}
        <aside className="flex min-h-0 flex-col border-t border-border lg:border-t-0 lg:border-l">
          <Tabs defaultValue="agent" className="flex min-h-0 flex-1 flex-col">
            <div className="px-3 pt-3">
              <TabsList className="w-full">
                <TabsTrigger value="agent" className="flex-1">
                  Agent
                </TabsTrigger>
                <TabsTrigger value="code" className="flex-1">
                  Code
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="agent" className="min-h-0 flex-1">
              <ComponentAgentPanel
                code={code}
                baseId={fork.baseId}
                exportName={fork.exportName}
                onApply={applyCode}
              />
            </TabsContent>
            <TabsContent value="code" className="min-h-0 flex-1 p-3">
              <Textarea
                value={code}
                onChange={(e) => applyCode(e.target.value)}
                spellCheck={false}
                className="h-full resize-none font-mono text-xs leading-relaxed"
              />
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}
