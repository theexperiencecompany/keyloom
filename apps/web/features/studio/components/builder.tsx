"use client";

import type { PlayerRef } from "@remotion/player";
import { type Project, projectDuration } from "@workspace/compositions/project";
import { compositionsById } from "@workspace/compositions/registry";
import { resolveTransition } from "@workspace/compositions/transitions";
import {
  type Layout,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useAudioSearch } from "../hooks/use-audio-search";
import { useExportRender } from "../hooks/use-export-render";
import { usePlayerControls } from "../hooks/use-player-controls";
import { useProjectIO } from "../hooks/use-project-io";
import type { ExportOptions } from "../lib/export-options";
import {
  captureCurrentFrame,
  downloadPngBlob,
  screenshotFilename,
} from "../lib/local-screenshot";
import { registerImageProxy } from "../lib/register-image-proxy";
import { PlayerProvider } from "../state/player-context";
import { initialStudioState, studioReducer } from "../state/reducer";
import { CommandPalette } from "./command-palette";
import { ExportProgressOverlay } from "./export-progress-overlay";
import { ExportSettingsModal } from "./export-settings-modal";
import { Inspector, type InspectorTab } from "./inspector";
import { LibraryPanel } from "./library-panel";
import { PlaybackControls } from "./playback-controls";
import { PreviewStage } from "./preview-stage";
import { ProjectAudioControl } from "./project-audio-control";
import { Timeline } from "./timeline";
import { ToolRail } from "./tool-rail";
import { TopBar } from "./top-bar";
import { UploadPanel } from "./upload-panel";

// Lazy-load the agent panel — it pulls in the AI SDK + the whole tool surface,
// which the editor doesn't need until the user opens the agent. Keeping it off
// the initial graph speeds up the /studio compile and first paint.
const AgentPanel = dynamic(
  () => import("./agent-panel").then((m) => m.AgentPanel),
  { ssr: false },
);

export function Builder() {
  // ----------------------------------------------------------------------
  // Studio state
  // ----------------------------------------------------------------------
  const [state, dispatch] = useReducer(studioReducer, initialStudioState);
  const audioSearch = useAudioSearch();

  // Deep-link from the gallery: /studio?component=<id> opens the studio with
  // that composition added as the first clip (and selected, so the inspector
  // shows it). Strip the param afterwards so a refresh doesn't re-add it.
  const didInitFromParam = useRef(false);
  useEffect(() => {
    if (didInitFromParam.current) return;
    didInitFromParam.current = true;
    const id = new URLSearchParams(window.location.search).get("component");
    if (id && compositionsById[id]) {
      dispatch({ type: "ADD_CLIP", compositionId: id });
      window.history.replaceState(null, "", "/studio");
    }
  }, []);
  // Bump the version key when changing default sizes so old persisted
  // layouts don't pin panels at sizes that no longer make sense.
  const LAYOUT_STORAGE_KEY = "studio-layout-v4";
  // The persisted layout MUST NOT be read during the initial render: the
  // server has no access to localStorage and renders panels at their default
  // sizes, so reading it on the client's first render produces a hydration
  // mismatch. Start undefined (matching the server), then load the stored
  // layout after mount and remount the panel group via `layoutKey` so the
  // restored sizes actually take effect.
  const [layout, setLayout] = useState<Layout | undefined>(undefined);
  const [layoutKey, setLayoutKey] = useState("initial");
  // Gate persistence until the stored layout has been restored, so a
  // layout-change event fired during the initial default-sized mount can't
  // overwrite the saved layout before we've had a chance to read it back.
  const layoutLoadedRef = useRef(false);
  useEffect(() => {
    try {
      // One-time cleanup of older versions so stale narrow layouts don't
      // linger silently in the user's storage.
      window.localStorage.removeItem("studio-layout-v1");
      window.localStorage.removeItem("studio-layout-v2");
      window.localStorage.removeItem("studio-layout-v3");
      const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (raw) setLayout(JSON.parse(raw) as Layout);
    } catch {
      // localStorage may be disabled (private mode / quota); silent fallback.
    }
    layoutLoadedRef.current = true;
    setLayoutKey("loaded");
  }, []);
  const handleLayoutChanged = useCallback((next: Layout) => {
    if (!layoutLoadedRef.current) return;
    setLayout(next);
    try {
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage may be disabled (private mode / quota); silent fallback.
    }
  }, []);
  const { project, selection, openPanel } = state;
  const selectedClipId = selection?.kind === "clip" ? selection.id : null;
  const isAudioSelected = selection?.kind === "audio";
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
    startLambda: startLambdaExport,
    reset: resetExport,
    cancel: cancelExport,
    download: downloadExport,
  } = useExportRender();
  const isExporting =
    exportState.phase === "starting" || exportState.phase === "rendering";
  const [exportSettingsOpen, setExportSettingsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
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

  // Register the image-proxy service worker once. It transparently routes
  // every cross-origin image fetch through `/api/img/<base64>` so the
  // browser doesn't taint the export canvas on external avatars.
  useEffect(() => {
    void registerImageProxy();
  }, []);

  const playerControls = usePlayerControls(playerRef, totalDuration);

  // ----------------------------------------------------------------------
  // Screenshot current frame → PNG download
  //
  // Pauses the player first so the rendered still actually matches the
  // user's visible viewport (any in-flight playback would have already
  // advanced past the frame the user is "looking at"). If playback was
  // running, restore it after the capture resolves.
  // ----------------------------------------------------------------------
  const projectRef = useRef(project);
  projectRef.current = project;
  const handleCaptureFrame = useCallback(async () => {
    const player = playerRef.current;
    if (!player) return;
    const wasPlaying = player.isPlaying();
    if (wasPlaying) player.pause();
    try {
      const blob = await captureCurrentFrame(playerRef, projectRef.current);
      downloadPngBlob(blob, screenshotFilename());
      toast.success("Frame saved to Downloads");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to capture frame";
      console.error("[screenshot] capture failed", err);
      toast.error(message);
    } finally {
      if (wasPlaying) {
        // Re-read the ref — the player might have unmounted while we waited
        // on the render (e.g. user cleared the timeline).
        playerRef.current?.play();
      }
    }
  }, []);

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
          width={project.width}
          height={project.height}
          onChangeFormat={(width, height) =>
            dispatch({ type: "SET_PROJECT_FORMAT", width, height })
          }
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

          <ResizablePanelGroup
            key={layoutKey}
            orientation="horizontal"
            defaultLayout={layout}
            onLayoutChanged={handleLayoutChanged}
            className="flex-1"
          >
            {openPanel !== null && (
              <>
                <ResizablePanel
                  id="studio-side"
                  defaultSize="288px"
                  minSize="240px"
                  maxSize="720px"
                >
                  {openPanel === "library" && (
                    <LibraryPanel
                      onAdd={(id) =>
                        dispatch({ type: "ADD_CLIP", compositionId: id })
                      }
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
                  {openPanel === "upload" && (
                    <UploadPanel
                      currentAudio={project.audio}
                      audioSearch={audioSearch}
                      onSet={(audio) =>
                        dispatch({ type: "SET_PROJECT_AUDIO", audio })
                      }
                      onClear={() => dispatch({ type: "CLEAR_PROJECT_AUDIO" })}
                      onClose={() =>
                        dispatch({ type: "TOGGLE_PANEL", panel: "upload" })
                      }
                    />
                  )}
                  {openPanel === "agent" && (
                    <AgentPanel
                      project={project}
                      dispatch={dispatch}
                      selectedClip={
                        selectedClip
                          ? {
                              id: selectedClip.id,
                              compositionId: selectedClip.compositionId,
                            }
                          : null
                      }
                      onClose={() =>
                        dispatch({ type: "TOGGLE_PANEL", panel: "agent" })
                      }
                    />
                  )}
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}

            <ResizablePanel id="studio-main" minSize="400px">
              <main className="flex h-full min-w-0 flex-col">
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
                  audioSelected={isAudioSelected}
                  onSelectAudio={() => dispatch({ type: "SELECT_AUDIO" })}
                  onUpdateAudio={(patch) =>
                    dispatch({ type: "UPDATE_PROJECT_AUDIO", patch })
                  }
                  onSelect={(id) =>
                    dispatch({ type: "SELECT_CLIP", clipId: id })
                  }
                  onReorder={(clipIds) =>
                    dispatch({ type: "REORDER_CLIPS", clipIds })
                  }
                  onDelete={(id) =>
                    dispatch({ type: "DELETE_CLIP", clipId: id })
                  }
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
                  onCapture={handleCaptureFrame}
                />
              </main>
            </ResizablePanel>

            {(selectedClip && selectedInfo) ||
            (isAudioSelected && project.audio) ? (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel
                  id="studio-inspector"
                  defaultSize="320px"
                  minSize="280px"
                  maxSize="720px"
                >
                  {selectedClip && selectedInfo ? (
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
                      onClose={() =>
                        dispatch({ type: "SELECT_CLIP", clipId: null })
                      }
                    />
                  ) : isAudioSelected && project.audio ? (
                    // Audio inspector — surfaces when the user clicks the
                    // audio track row in the timeline. Mutually exclusive
                    // with the clip inspector.
                    <aside className="flex h-full w-full flex-col gap-3 overflow-y-auto border-l border-border bg-background p-3">
                      <div className="flex items-center justify-between px-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Project audio
                        </p>
                        <button
                          type="button"
                          onClick={() => dispatch({ type: "CLEAR_SELECTION" })}
                          className="text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          Close
                        </button>
                      </div>
                      <ProjectAudioControl
                        audio={project.audio}
                        fps={project.fps}
                        videoDurationFrames={totalDuration}
                        sourceDurationSec={project.audio.sourceDurationSec}
                        onPatch={(patch) =>
                          dispatch({ type: "UPDATE_PROJECT_AUDIO", patch })
                        }
                        onClear={() =>
                          dispatch({ type: "CLEAR_PROJECT_AUDIO" })
                        }
                        onOpenUpload={() =>
                          dispatch({ type: "TOGGLE_PANEL", panel: "upload" })
                        }
                      />
                    </aside>
                  ) : null}
                </ResizablePanel>
              </>
            ) : null}
          </ResizablePanelGroup>
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
          onStartServer={(options) => startLambdaExport(project, options)}
          project={project}
          projectWidth={project.width}
          projectHeight={project.height}
          durationInFrames={totalDuration}
          fps={project.fps}
        />

        <CommandPalette
          open={commandPaletteOpen}
          onOpenChange={setCommandPaletteOpen}
          onAddComposition={(compositionId) =>
            dispatch({ type: "ADD_CLIP", compositionId })
          }
          onExport={() => setExportSettingsOpen(true)}
          onScreenshot={handleCaptureFrame}
          onTogglePlay={playerControls.handlePlayPause}
          onSkipToStart={playerControls.handleSkipToStart}
          onSkipToEnd={playerControls.handleSkipToEnd}
          onOpenLibrary={() =>
            dispatch({ type: "TOGGLE_PANEL", panel: "library" })
          }
          onOpenUpload={() =>
            dispatch({ type: "TOGGLE_PANEL", panel: "upload" })
          }
          onSaveProject={handleSaveProject}
          onImportProject={() => {
            // Conjure a transient file picker so the cmd-K Import action
            // doesn't depend on TopBar's hidden input being mounted.
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "application/json,.json";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) void handleLoadProjectFile(file);
            };
            input.click();
          }}
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
