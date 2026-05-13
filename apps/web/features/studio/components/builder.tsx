"use client";

import type { PlayerRef } from "@remotion/player";
import { type Project, projectDuration } from "@workspace/compositions/project";
import { compositionsById } from "@workspace/compositions/registry";
import { resolveTransition } from "@workspace/compositions/transitions";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import { useExportRender } from "../hooks/use-export-render";
import { usePlayerControls } from "../hooks/use-player-controls";
import { useProjectIO } from "../hooks/use-project-io";
import type { ExportOptions } from "../lib/export-options";
import { PlayerProvider } from "../state/player-context";
import { initialStudioState, studioReducer } from "../state/reducer";
import { AgentPanel } from "./agent-panel";
import { ExportProgressOverlay } from "./export-progress-overlay";
import { ExportSettingsModal } from "./export-settings-modal";
import { Inspector, type InspectorTab } from "./inspector";
import { LibraryPanel } from "./library-panel";
import { PlaybackControls } from "./playback-controls";
import { PreviewStage } from "./preview-stage";
import { Timeline } from "./timeline";
import { ToolRail } from "./tool-rail";
import { TopBar } from "./top-bar";

export function Builder() {
  // ----------------------------------------------------------------------
  // Studio state
  // ----------------------------------------------------------------------
  const [state, dispatch] = useReducer(studioReducer, initialStudioState);
  const { project, selectedClipId, openPanel } = state;
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("content");

  const totalDuration = projectDuration(project);
  const totalSeconds = totalDuration / project.fps;
  const hasClips = project.clips.length > 0;

  const selectedClip = project.clips.find((c) => c.id === selectedClipId);
  const selectedInfo = selectedClip
    ? compositionsById[selectedClip.compositionId]
    : undefined;

  const playerInputProps = useMemo(() => project, [project]);

  // ----------------------------------------------------------------------
  // Export-to-MP4 (separate from Save / Load JSON below)
  // ----------------------------------------------------------------------
  const {
    state: exportState,
    start: startExport,
    reset: resetExport,
    cancel: cancelExport,
    download: downloadExport,
  } = useExportRender();
  const isExporting =
    exportState.phase === "starting" || exportState.phase === "rendering";
  const [exportSettingsOpen, setExportSettingsOpen] = useState(false);
  const lastExportOptionsRef = useRef<ExportOptions | null>(null);

  const handleStartExport = (options: ExportOptions) => {
    lastExportOptionsRef.current = options;
    startExport(project, options);
  };
  const handleRetryExport = () => {
    if (lastExportOptionsRef.current) {
      startExport(project, lastExportOptionsRef.current);
    } else {
      setExportSettingsOpen(true);
    }
  };

  // ----------------------------------------------------------------------
  // Player ref + version
  //
  // The Player remounts when `hasClips` toggles. We bump `playerVersion` on
  // each mount so the per-frame consumer hooks (usePlayerFrame, useIsPlaying)
  // re-attach their listeners to the fresh ref. Builder itself does NOT
  // subscribe to frame updates — that would force a 60fps re-render of the
  // whole tree.
  // ----------------------------------------------------------------------
  const playerRef = useRef<PlayerRef>(null);
  const [playerVersion, setPlayerVersion] = useState(0);

  useEffect(() => {
    if (hasClips) setPlayerVersion((v) => v + 1);
  }, [hasClips]);

  const playerControls = usePlayerControls(playerRef, totalDuration);

  // ----------------------------------------------------------------------
  // Save / Load Project JSON
  // ----------------------------------------------------------------------
  const { handleSaveProject, handleLoadProjectFile } = useProjectIO(
    project,
    dispatch,
  );

  // ----------------------------------------------------------------------
  // Side effects: seek-on-clip-select + spacebar play/pause
  // ----------------------------------------------------------------------
  useSeekToClipOnSelect(playerRef, project, selectedClipId);
  useSpacebarPlayPause(hasClips, playerControls.handlePlayPause);

  // ----------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------
  return (
    <PlayerProvider playerRef={playerRef} version={playerVersion}>
      <div className="flex h-screen flex-col bg-background text-foreground">
        <TopBar
          clipCount={project.clips.length}
          totalSeconds={totalSeconds}
          exporting={isExporting}
          canExport={hasClips}
          canSave={hasClips}
          fps={project.fps}
          projectDefaultTransition={project.defaultTransition}
          onUpdateProjectTransition={(transition) =>
            dispatch({ type: "UPDATE_PROJECT_TRANSITION", transition })
          }
          onExport={() => setExportSettingsOpen(true)}
          onSaveProject={handleSaveProject}
          onLoadProjectFile={handleLoadProjectFile}
        />

        <div className="relative flex min-h-0 flex-1">
          <ToolRail
            openPanel={openPanel}
            onToggle={(p) => dispatch({ type: "TOGGLE_PANEL", panel: p })}
          />

          {openPanel === "library" && (
            <LibraryPanel
              onAdd={(id) => dispatch({ type: "ADD_CLIP", compositionId: id })}
              onAddEffect={(effectId) => {
                if (!selectedClipId) return;
                dispatch({
                  type: "ADD_EFFECT",
                  clipId: selectedClipId,
                  effectId,
                });
              }}
              selectedClipId={selectedClipId}
              onClose={() =>
                dispatch({ type: "TOGGLE_PANEL", panel: "library" })
              }
            />
          )}

          {openPanel === "agent" && (
            <AgentPanel
              onClose={() => dispatch({ type: "TOGGLE_PANEL", panel: "agent" })}
            />
          )}

          <main className="flex min-w-0 flex-1 flex-col">
            <PreviewStage
              project={project}
              playerInputProps={playerInputProps}
              totalDuration={totalDuration}
              hasClips={hasClips}
              onOpenLibrary={() =>
                dispatch({ type: "TOGGLE_PANEL", panel: "library" })
              }
              playerRef={playerRef}
            />

            <PlaybackControls
              totalDuration={totalDuration}
              fps={project.fps}
              disabled={!hasClips}
              onPlayPause={playerControls.handlePlayPause}
              onSkipToStart={playerControls.handleSkipToStart}
              onSkipToEnd={playerControls.handleSkipToEnd}
            />

            <Timeline
              project={project}
              selectedClipId={selectedClipId}
              onSelect={(id) => dispatch({ type: "SELECT_CLIP", clipId: id })}
              onReorder={(clipIds) =>
                dispatch({ type: "REORDER_CLIPS", clipIds })
              }
              onDelete={(id) => dispatch({ type: "DELETE_CLIP", clipId: id })}
              onDurationChange={(id, durationInFrames) =>
                dispatch({
                  type: "UPDATE_CLIP_DURATION",
                  clipId: id,
                  durationInFrames,
                })
              }
              onUpdateTransition={(id, transition) =>
                dispatch({
                  type: "UPDATE_CLIP_TRANSITION",
                  clipId: id,
                  transition,
                })
              }
              onSelectTransition={(id) => {
                dispatch({ type: "SELECT_CLIP", clipId: id });
                setInspectorTab("motion");
              }}
              onSeek={playerControls.handleSeek}
              onScrubStart={playerControls.handleScrubStart}
              onScrubEnd={playerControls.handleScrubEnd}
            />
          </main>

          {selectedClip && selectedInfo && (
            <Inspector
              clip={selectedClip}
              info={selectedInfo}
              isFirst={project.clips[0]?.id === selectedClip.id}
              fps={project.fps}
              projectDefaultTransition={project.defaultTransition}
              tab={inspectorTab}
              onTabChange={setInspectorTab}
              onChange={(next) =>
                dispatch({
                  type: "UPDATE_CLIP_PROPS",
                  clipId: selectedClip.id,
                  props: next,
                })
              }
              onUpdateStyle={(patch) =>
                dispatch({
                  type: "UPDATE_CLIP_STYLE",
                  clipId: selectedClip.id,
                  patch,
                })
              }
              onResetStyle={() =>
                dispatch({
                  type: "RESET_CLIP_STYLE",
                  clipId: selectedClip.id,
                })
              }
              onUpdateTransition={(transition) =>
                dispatch({
                  type: "UPDATE_CLIP_TRANSITION",
                  clipId: selectedClip.id,
                  transition,
                })
              }
              onUpdateEffect={(effectInstanceId, props) =>
                dispatch({
                  type: "UPDATE_EFFECT_PROPS",
                  clipId: selectedClip.id,
                  effectInstanceId,
                  props,
                })
              }
              onRemoveEffect={(effectInstanceId) =>
                dispatch({
                  type: "REMOVE_EFFECT",
                  clipId: selectedClip.id,
                  effectInstanceId,
                })
              }
              onClose={() => dispatch({ type: "SELECT_CLIP", clipId: null })}
            />
          )}
        </div>

        <ExportProgressOverlay
          state={exportState}
          onClose={resetExport}
          onCancel={cancelExport}
          onDownload={downloadExport}
          onRetry={handleRetryExport}
        />

        <ExportSettingsModal
          open={exportSettingsOpen}
          onOpenChange={setExportSettingsOpen}
          onStart={handleStartExport}
          projectWidth={project.width}
          projectHeight={project.height}
          durationInFrames={totalDuration}
          fps={project.fps}
        />
      </div>
    </PlayerProvider>
  );
}

// ---------------------------------------------------------------------------
// Local effects
// ---------------------------------------------------------------------------

/**
 * When the user selects a clip in the timeline, jump the playhead to its
 * starting frame. The Player ref may not be populated on first mount, so we
 * retry a few rAF ticks before giving up.
 */
function useSeekToClipOnSelect(
  playerRef: React.RefObject<PlayerRef | null>,
  project: Project,
  selectedClipId: string | null,
) {
  // Read project through a ref so the effect only re-runs when the user
  // changes which clip is selected — NOT on every reducer dispatch. Resizing
  // a clip otherwise re-fires `player.seekTo` on every pointermove, which
  // (via Remotion's synchronous frameupdate event) trips React's max-update
  // depth guard.
  const projectRef = useRef(project);
  projectRef.current = project;

  useEffect(() => {
    if (!selectedClipId) return;
    const startFrame = clipStartFrame(projectRef.current, selectedClipId);
    let cancelled = false;

    function attempt(retriesLeft: number) {
      if (cancelled) return;
      const player = playerRef.current;
      if (player) {
        player.seekTo(startFrame);
        return;
      }
      if (retriesLeft > 0) {
        requestAnimationFrame(() => attempt(retriesLeft - 1));
      }
    }

    attempt(8);
    return () => {
      cancelled = true;
    };
  }, [selectedClipId, playerRef]);
}

/**
 * Spacebar toggles playback unless the user is typing or an interactive
 * element (button, link, select, etc.) is focused — pressing space on a
 * focused button would otherwise both click the button AND toggle playback.
 */
function useSpacebarPlayPause(hasClips: boolean, onPlayPause: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== " " || !hasClips) return;
      if (isInteractiveElementFocused()) return;
      e.preventDefault();
      onPlayPause();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasClips, onPlayPause]);
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function clipStartFrame(project: Project, clipId: string): number {
  let sum = 0;
  for (let i = 0; i < project.clips.length; i++) {
    const clip = project.clips[i];
    if (!clip) continue;
    if (i > 0) {
      const t = resolveTransition({
        clipTransition: clip.transition,
        projectDefault: project.defaultTransition,
        index: i,
      });
      if (t.kind !== "none") sum -= t.durationInFrames;
    }
    if (clip.id === clipId) return Math.max(0, sum);
    sum += clip.durationInFrames;
  }
  return 0;
}

function isInteractiveElementFocused(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body) return false;
  const tag = el.tagName.toLowerCase();
  if (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    tag === "button" ||
    tag === "a" ||
    el.isContentEditable
  ) {
    return true;
  }
  // Custom interactive controls (radix triggers etc.)
  const role = el.getAttribute("role");
  if (
    role === "button" ||
    role === "menuitem" ||
    role === "option" ||
    role === "tab" ||
    role === "switch" ||
    role === "checkbox" ||
    role === "radio"
  ) {
    return true;
  }
  if (el.tabIndex >= 0 && el.hasAttribute("tabindex")) return true;
  return false;
}
