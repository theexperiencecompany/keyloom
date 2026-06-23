import type { Field } from "@workspace/compositions/schema";

/** One component as listed by the MCP `list_components` tool. */
export type McpComponentSummary = {
  id: string;
  title: string;
  description: string;
  category: string;
  /** Brand-locked components (iMessage, WhatsApp, …) ignore color/font
   *  overrides — only their content fields are meaningful. */
  brandLocked: boolean;
};

/** Full editing contract for one component, returned by `get_component_schema`.
 *  Everything the caller's model needs to fill the props accurately and render
 *  at the right dimensions. */
export type McpComponentSchema = McpComponentSummary & {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  agentNotes?: string;
  fields: Field[];
  defaultProps: Record<string, unknown>;
};

/** Optional render knobs for `render_component`. All default to the
 *  composition's natural values from the registry. */
export type RenderComponentOptions = {
  fps?: number;
  durationInFrames?: number;
  /** Resolution multiplier, clamped to [0.25, 2]. */
  scale?: number;
  videoBitrateKbps?: number;
  /** Absolute path; when set, the finished MP4 is also downloaded here. */
  outFile?: string;
};

/** What a completed (blocking) render reports back. */
export type RenderComponentResult = {
  compositionId: string;
  /** Time-limited, downloadable URL to the rendered MP4. */
  url: string;
  filename: string;
  /** Local path the MP4 was saved to, when `outFile` was requested. */
  outFile?: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
};

/** One clip in a multi-component project render (`render_project`). */
export type ProjectClipInput = {
  /** Component id from `list_components`. */
  compositionId: string;
  /** Props for this clip, merged over the component's defaults. */
  props?: Record<string, unknown>;
  /** How long this clip plays. Defaults to the component's natural length. */
  durationInFrames?: number;
  /** Universal Style overrides (background / color / fontFamily / accent). */
  style?: Record<string, unknown>;
  /** How this clip enters from the previous one (e.g. { kind, durationInFrames }). */
  transition?: Record<string, unknown>;
};

/** Render knobs for `render_project` (a stitched multi-clip video). */
export type RenderProjectOptions = {
  fps?: number;
  width?: number;
  height?: number;
  /** Resolution multiplier, clamped to [0.25, 2]. */
  scale?: number;
  videoBitrateKbps?: number;
  /** Absolute path; when set, the finished MP4 is also downloaded here. */
  outFile?: string;
};

/** Handle returned by `startRender` — pass renderId + bucketName to
 *  `getRenderStatus` to poll. */
export type StartRenderResult = {
  compositionId: string;
  renderId: string;
  bucketName: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
};

/** Progress snapshot from `getRenderStatus`. `url`/`filename` are present once
 *  `done` is true. */
export type RenderStatus = {
  done: boolean;
  /** 0–1 overall progress. */
  progress: number;
  /** Raw, time-limited presigned S3 URL. Fragile to copy (very long); prefer
   *  `downloadUrl` when handing a link to a client/user. */
  url?: string;
  /** Short, copy-safe link that re-presigns and redirects to the MP4. */
  downloadUrl?: string;
  filename?: string;
};
