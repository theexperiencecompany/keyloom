# Roadmap

## Phase 1 — Chat Composer (GAIA)
- [ ] Connect GAIA chat interface to the studio
- [ ] Parse chat messages into clip/composition intent
- [ ] Render AI-suggested compositions into the timeline from chat
- [ ] Support iterative edits via follow-up messages ("make it slower", "change text")
- [ ] Stream composition previews as GAIA responds

## Phase 2 — GAIA State Machine
- [ ] Define editor states (idle, composing, rendering, exporting)
- [ ] Wire GAIA session lifecycle to state transitions
- [ ] Handle error, retry, and cancellation states cleanly
- [ ] Persist state across page reloads (session recovery)
- [ ] Surface current state visibly in the editor UI

## Phase 3 — Manual Videos
- [ ] Timeline scrubber with frame-accurate seek
- [ ] Clip drag-and-drop reordering
- [ ] Per-clip prop editor (text, colors, duration, timing)
- [ ] Add / remove / duplicate clips manually
- [ ] Undo/redo history

## Phase 4 — Agentic Video Editor
- [ ] Agent can autonomously assemble a full video from a brief
- [ ] Agent selects compositions, writes copy, sets durations
- [ ] Agent iterates on feedback without full reruns
- [ ] Multi-step tool use: search assets → pick compositions → set props → preview
- [ ] Export-ready output with one click after agent completes

## Phase 5 — React + Motion as a Scene
- [ ] Code editor panel inside the studio (Monaco or CodeMirror)
- [ ] Live-evaluate a React component as a Remotion composition
- [ ] Support `motion.div` (Framer Motion) natively inside the scene sandbox
- [ ] Hot-reload scene on code change with no full re-render
- [ ] Export code-based scenes the same way as composition-based ones
