"use client";

import type { PlayerRef } from "@remotion/player";
import { type Project, projectDuration } from "@workspace/compositions/project";
import { compositionsById } from "@workspace/compositions/registry";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useExportRender } from "../hooks/use-export-render";
import { downloadProject, parseProjectJson } from "../lib/project-io";
import { PlayerProvider } from "../state/player-context";
import { initialStudioState, studioReducer } from "../state/reducer";
import { AgentPanel } from "./agent-panel";
import { ExportProgressOverlay } from "./export-progress-overlay";
import { Inspector } from "./inspector";
import { LibraryPanel } from "./library-panel";
import { PlaybackControls } from "./playback-controls";
import { PreviewStage } from "./preview-stage";
import { Timeline } from "./timeline";
import { ToolRail } from "./tool-rail";
import { TopBar } from "./top-bar";

export function Builder() {
  const [state, dispatch] = useReducer(studioReducer, initialStudioState);
  const {
    state: exportState,
    start: startExport,
    reset: resetExport,
  } = useExportRender();

  const totalDuration = projectDuration(state.project);
  const totalSeconds = totalDuration / state.project.fps;
  const selectedClip = state.project.clips.find(
    (c) => c.id === state.selectedClipId,
  );
  const selectedInfo = selectedClip
    ? compositionsById[selectedClip.compositionId]
    : undefined;

  const playerInputProps = useMemo(() => state.project, [state.project]);
  const hasClips = state.project.clips.length > 0;
  const isExporting =
    exportState.phase === "starting" || exportState.phase === "rendering";

  const playerRef = useRef<PlayerRef>(null);
  const wasPlayingBeforeScrubRef = useRef(false);

  // Bumps every time the Player mounts. Lets per-frame consumer hooks
  // (usePlayerFrame, useIsPlaying) re-attach to the fresh ref without
  // forcing Builder itself to re-render at 60fps.
  const [playerVersion, setPlayerVersion] = useState(0);
  useEffect(() => {
    if (hasClips) setPlayerVersion((v) => v + 1);
  }, [hasClips]);

  useEffect(() => {
    if (!state.selectedClipId) return;
    const start = clipStartFrame(state.project, state.selectedClipId);
    let cancelled = false;
    function attempt(retries: number) {
      if (cancelled) return;
      const p = playerRef.current;
      if (p) {
        p.seekTo(start);
        return;
      }
      if (retries > 0) requestAnimationFrame(() => attempt(retries - 1));
    }
    attempt(8);
    return () => {
      cancelled = true;
    };
  }, [state.selectedClipId, state.project]);

  const handleSeek = useCallback((frame: number) => {
    playerRef.current?.seekTo(frame);
  }, []);

  const handleScrubStart = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    wasPlayingBeforeScrubRef.current = p.isPlaying();
    if (wasPlayingBeforeScrubRef.current) p.pause();
  }, []);

  const handleScrubEnd = useCallback(() => {
    if (wasPlayingBeforeScrubRef.current) playerRef.current?.play();
    wasPlayingBeforeScrubRef.current = false;
  }, []);

  const handlePlayPause = useCallback(() => {
    playerRef.current?.toggle();
  }, []);

  const handleSkipToStart = useCallback(() => {
    playerRef.current?.seekTo(0);
  }, []);

  const handleSkipToEnd = useCallback(() => {
    playerRef.current?.seekTo(Math.max(0, totalDuration - 1));
  }, [totalDuration]);

  const handleSaveProject = useCallback(() => {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    downloadProject(state.project, `project-${stamp}.json`);
  }, [state.project]);

  const handleLoadProjectFile = useCallback(async (file: File) => {
    const text = await file.text();
    const result = parseProjectJson(text);
    if (!result.ok) {
      window.alert(`Couldn't load project:\n${result.error}`);
      return;
    }
    if (result.warnings.length > 0) {
      window.alert(`Loaded with warnings:\n\n${result.warnings.join("\n")}`);
    }
    dispatch({ type: "LOAD_PROJECT", project: result.project });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== " " || !hasClips) return;
      const el = document.activeElement;
      if (el) {
        const tag = el.tagName.toLowerCase();
        if (
          tag === "input" ||
          tag === "textarea" ||
          (el as HTMLElement).isContentEditable
        )
          return;
      }
      e.preventDefault();
      handlePlayPause();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasClips, handlePlayPause]);

  return (
    <PlayerProvider playerRef={playerRef} version={playerVersion}>
      <div className="flex h-screen flex-col bg-background text-foreground">
        <TopBar
          clipCount={state.project.clips.length}
          totalSeconds={totalSeconds}
          exporting={isExporting}
          canExport={hasClips}
          canSave={hasClips}
          onExport={() => startExport(state.project)}
          onSaveProject={handleSaveProject}
          onLoadProjectFile={handleLoadProjectFile}
        />

        <div className="relative flex min-h-0 flex-1">
          <ToolRail
            openPanel={state.openPanel}
            onToggle={(p) => dispatch({ type: "TOGGLE_PANEL", panel: p })}
          />

          {state.openPanel === "library" && (
            <LibraryPanel
              onAdd={(id) => dispatch({ type: "ADD_CLIP", compositionId: id })}
              onClose={() =>
                dispatch({ type: "TOGGLE_PANEL", panel: "library" })
              }
            />
          )}

          {state.openPanel === "agent" && (
            <AgentPanel
              onClose={() => dispatch({ type: "TOGGLE_PANEL", panel: "agent" })}
            />
          )}

          <main className="flex min-w-0 flex-1 flex-col">
            <PreviewStage
              project={state.project}
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
              fps={state.project.fps}
              disabled={!hasClips}
              onPlayPause={handlePlayPause}
              onSkipToStart={handleSkipToStart}
              onSkipToEnd={handleSkipToEnd}
            />

            <Timeline
              project={state.project}
              selectedClipId={state.selectedClipId}
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
              onSeek={handleSeek}
              onScrubStart={handleScrubStart}
              onScrubEnd={handleScrubEnd}
            />
          </main>

          {selectedClip && selectedInfo && (
            <Inspector
              clip={selectedClip}
              info={selectedInfo}
              onChange={(next) =>
                dispatch({
                  type: "UPDATE_CLIP_PROPS",
                  clipId: selectedClip.id,
                  props: next,
                })
              }
              onClose={() => dispatch({ type: "SELECT_CLIP", clipId: null })}
            />
          )}
        </div>

        <ExportProgressOverlay state={exportState} onClose={resetExport} />
      </div>
    </PlayerProvider>
  );
}

function clipStartFrame(project: Project, clipId: string): number {
  let sum = 0;
  for (const c of project.clips) {
    if (c.id === clipId) return sum;
    sum += c.durationInFrames;
  }
  return 0;
}
