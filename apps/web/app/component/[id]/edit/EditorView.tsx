"use client";

import { ArrowReloadHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Player } from "@remotion/player";
import { ProjectComposition } from "@workspace/compositions/compositions/Project/Project";
import { FieldsRenderer } from "@workspace/compositions/editors";
import { type Project, projectDuration } from "@workspace/compositions/project";
import { compositionsById } from "@workspace/compositions/registry";
import type { AnyCompositionInfo } from "@workspace/compositions/schema";
import { Button } from "@workspace/ui/components/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { useEffect, useMemo, useState } from "react";
import { ExportProgressOverlay } from "@/features/studio/components/export-progress-overlay";
import { ExportSettingsModal } from "@/features/studio/components/export-settings-modal";
import { useExportRender } from "@/features/studio/hooks/use-export-render";

export function EditorView({
  info,
}: {
  info: Omit<AnyCompositionInfo, "calculateMetadata">;
}) {
  const [props, setProps] = useState<Record<string, unknown>>(
    () => structuredClone(info.defaultProps) as Record<string, unknown>,
  );

  // Same export path the studio uses: drives `@remotion/web-renderer` through
  // `ProjectComposition`, owns the progress state machine, and feeds the
  // shared ExportProgressOverlay card (progress bar, confetti, video preview).
  const exporter = useExportRender();
  const [showExportModal, setShowExportModal] = useState(false);

  // The server strips `calculateMetadata` (it's a function), so recompute the
  // duration here from the full client-side registry entry — otherwise a
  // composition whose length depends on its props (e.g. a chat that grows with
  // its messages) would be clipped to the static default and its last bubble
  // would never render.
  const calculateMetadata = compositionsById[info.id]?.calculateMetadata;
  const [durationInFrames, setDurationInFrames] = useState(
    info.durationInFrames,
  );
  // Dimensions can also depend on props (e.g. orientation → portrait makes the
  // canvas 9:16). calculateMetadata is the source of truth, so preview AND
  // export both follow it rather than the static registry size.
  const [dims, setDims] = useState({ width: info.width, height: info.height });
  useEffect(() => {
    if (!calculateMetadata) {
      setDurationInFrames(info.durationInFrames);
      setDims({ width: info.width, height: info.height });
      return;
    }
    let cancelled = false;
    Promise.resolve(calculateMetadata({ props }))
      .then((meta) => {
        if (cancelled) return;
        if (meta?.durationInFrames) setDurationInFrames(meta.durationInFrames);
        setDims({
          width: meta?.width ?? info.width,
          height: meta?.height ?? info.height,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [
    calculateMetadata,
    props,
    info.durationInFrames,
    info.width,
    info.height,
  ]);

  // Wrap the single composition into a one-clip Project so the preview and the
  // export both go through `ProjectComposition` — the exact same render tree
  // (background fill, font-smoothing, theme/clipStyle forwarding, EffectsWrap)
  // the studio uses. This is what makes the editor panel match the studio.
  const project: Project = useMemo(
    () => ({
      fps: info.fps,
      width: dims.width,
      height: dims.height,
      clips: [
        {
          id: info.id,
          compositionId: info.id,
          props,
          durationInFrames,
        },
      ],
    }),
    [info.fps, info.id, dims.width, dims.height, props, durationInFrames],
  );

  const totalDuration = useMemo(() => projectDuration(project), [project]);

  // Chat compositions get a dedicated Messages tab so the conversation editor
  // has the full sidebar height (instead of being buried under the other
  // settings at the bottom). Everything else goes on the Settings tab.
  const hasChatField = info.fields.some((f) => f.kind === "chat");
  const generalFields = info.fields.filter((f) => f.kind !== "chat");
  const chatFields = info.fields.filter((f) => f.kind === "chat");
  // Clearing the chat field empties the thread so a fresh conversation can be
  // built from scratch.
  const chatKey = chatFields[0]?.key;
  const chatMessages = chatKey
    ? (props[chatKey] as unknown[] | undefined)
    : undefined;
  const hasMessages = Array.isArray(chatMessages) && chatMessages.length > 0;
  const clearMessages = () => {
    if (chatKey) setProps((p) => ({ ...p, [chatKey]: [] }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] lg:min-h-0 lg:flex-1">
      <aside className="flex flex-col border-b border-border lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        {hasChatField ? (
          <Tabs
            defaultValue="messages"
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="px-3 pt-3">
              <TabsList className="w-full">
                <TabsTrigger value="messages" className="flex-1">
                  Messages
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent
              value="messages"
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Conversation
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={clearMessages}
                  disabled={!hasMessages}
                  title="Clear all messages"
                >
                  <HugeiconsIcon
                    icon={ArrowReloadHorizontalIcon}
                    className="size-3.5"
                  />
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <FieldsRenderer
                  fields={chatFields}
                  value={props}
                  onChange={setProps}
                />
              </div>
            </TabsContent>
            <TabsContent
              value="settings"
              className="min-h-0 flex-1 overflow-y-auto"
            >
              <FieldsRenderer
                fields={generalFields}
                value={props}
                onChange={setProps}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <FieldsRenderer
              fields={info.fields}
              value={props}
              onChange={setProps}
            />
          </div>
        )}
        <div className="shrink-0 border-t border-border p-4">
          <Button
            className="w-full"
            onClick={() => setShowExportModal(true)}
            disabled={
              exporter.state.phase === "starting" ||
              exporter.state.phase === "rendering"
            }
          >
            Export video
          </Button>
        </div>
      </aside>

      <div className="flex items-center justify-center bg-muted/20 p-4 lg:min-h-0">
        <div
          className="max-h-full w-full max-w-[1600px] overflow-hidden rounded-lg border border-border bg-background shadow-sm"
          style={{ aspectRatio: `${dims.width} / ${dims.height}` }}
        >
          <Player
            component={ProjectComposition}
            inputProps={project}
            durationInFrames={totalDuration}
            fps={project.fps}
            compositionWidth={project.width}
            compositionHeight={project.height}
            style={{ width: "100%", height: "100%" }}
            controls
            loop
            autoPlay
            initiallyMuted
            numberOfSharedAudioTags={12}
            acknowledgeRemotionLicense
          />
        </div>
      </div>

      <ExportSettingsModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        onStart={(options) => exporter.start(project, options)}
        onStartServer={(options) => exporter.startLambda(project, options)}
        project={project}
        projectWidth={project.width}
        projectHeight={project.height}
        durationInFrames={totalDuration}
        fps={project.fps}
      />

      <ExportProgressOverlay
        state={exporter.state}
        onClose={exporter.reset}
        onCancel={exporter.cancel}
        onDownload={exporter.download}
        onRetry={() => exporter.start(project)}
      />
    </div>
  );
}
