/**
 * Keyloom MCP server — the thin "face" over the feature logic in this folder.
 *
 * It exposes four deterministic tools (no LLM in the server; the MCP client's
 * model does the field-filling):
 *   - list_components       — what you can render
 *   - get_component_schema  — a component's fields + defaults + dimensions
 *   - render_component      — fill props → render on Lambda → get an MP4 URL
 *   - render_project        — stitch MANY components into one video (a timeline)
 *
 * Run it over stdio (env is loaded from apps/web/.env.local by bun):
 *   bun run features/mcp/server.ts
 * then point Claude Desktop / Cursor at that command. See README in this folder.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { type ZodRawShape, z } from "zod";
import { getComponentSchema, listComponents } from "./components";
import { renderComponent, renderProject } from "./render";
import type { ProjectClipInput } from "./types";

const server = new McpServer({ name: "keyloom-video", version: "0.1.0" });

type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};
type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

/**
 * Registers a tool. We cast `registerTool` through `unknown`: the SDK's generic
 * inference over a Zod input shape can exceed TypeScript's instantiation depth
 * ("Type instantiation is excessively deep"), so we keep our own narrow handler
 * signature and read already-validated args off a plain record (the SDK still
 * validates inputs against `inputSchema` at runtime).
 */
function registerTool(
  name: string,
  config: { title: string; description: string; inputSchema: ZodRawShape },
  handler: ToolHandler,
): void {
  (
    server.registerTool as unknown as (
      name: string,
      config: unknown,
      handler: ToolHandler,
    ) => void
  )(name, config, handler);
}

function jsonText(value: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

function errorText(message: string): ToolResult {
  return { isError: true, content: [{ type: "text", text: message }] };
}

registerTool(
  "list_components",
  {
    title: "List video components",
    description:
      "List every video component you can fill and render — each with id, title, description, category, and whether it is brand-locked. Call this first to discover ids.",
    inputSchema: {},
  },
  async () => jsonText(listComponents()),
);

registerTool(
  "get_component_schema",
  {
    title: "Get a component's field schema",
    description:
      "Get one component's full editing contract: its fields, default props, agent notes, and natural dimensions (fps/width/height/duration). Read this before render_component so you fill the props correctly.",
    inputSchema: {
      componentId: z
        .string()
        .describe("Component id from list_components, e.g. 'MessageBubbles'."),
    },
  },
  async (args) => {
    const componentId = String(args.componentId ?? "");
    const schema = getComponentSchema(componentId);
    if (!schema) {
      return errorText(
        `Unknown component "${componentId}". Call list_components for valid ids.`,
      );
    }
    return jsonText(schema);
  },
);

registerTool(
  "render_component",
  {
    title: "Render a component to video",
    description:
      "Render one component to an MP4 with the given props (merged over the component's defaults). Renders on Lambda and waits for completion. By default it uses the component's natural dimensions; pass width AND height to render at a custom aspect ratio (e.g. 1080×1920 for 9:16, 1920×1080 for 16:9, 1080×1080 for 1:1). Returns a time-limited download URL; pass outFile (absolute path) to also save the MP4 to disk.",
    inputSchema: {
      componentId: z.string().describe("Component id from list_components."),
      props: z
        .record(z.string(), z.unknown())
        .optional()
        .describe(
          "Props to fill, matching the component's field schema. Merged over defaults.",
        ),
      fps: z.number().int().positive().optional(),
      durationInFrames: z.number().int().positive().optional(),
      width: z
        .number()
        .int()
        .positive()
        .optional()
        .describe(
          "Canvas width in px. Pass with height to force an aspect ratio.",
        ),
      height: z
        .number()
        .int()
        .positive()
        .optional()
        .describe(
          "Canvas height in px. Pass with width to force an aspect ratio.",
        ),
      scale: z
        .number()
        .positive()
        .optional()
        .describe("Resolution multiplier, 0.25–2 (default 1)."),
      outFile: z
        .string()
        .optional()
        .describe("Absolute path to also save the MP4 to."),
    },
  },
  async (args) => {
    try {
      const componentId = String(args.componentId ?? "");
      const props = (args.props as Record<string, unknown> | undefined) ?? {};
      const width = args.width as number | undefined;
      const height = args.height as number | undefined;
      const fps = args.fps as number | undefined;
      const durationInFrames = args.durationInFrames as number | undefined;
      const scale = args.scale as number | undefined;
      const outFile = args.outFile as string | undefined;

      // Custom dimensions → render the component inside a one-clip Project (the
      // only Lambda path that can force an arbitrary canvas size/aspect).
      if (width || height) {
        const result = await renderProject(
          [{ componentId, props, durationInFrames }],
          { fps, width, height, scale, outFile },
        );
        return jsonText({ ...result, compositionId: componentId });
      }

      const result = await renderComponent(componentId, props, {
        fps,
        durationInFrames,
        scale,
        outFile,
      });
      return jsonText(result);
    } catch (err) {
      return errorText(err instanceof Error ? err.message : String(err));
    }
  },
);

registerTool(
  "render_project",
  {
    title: "Render a multi-component video (timeline)",
    description:
      "Stitch SEVERAL components into ONE video — the same as building a timeline in the studio. Pass an ordered `clips` array; each clip is a component (by id) with its props, an optional durationInFrames (defaults to the component's natural length), an optional Style override, and an optional transition into it. Clips play back-to-back with transitions. Renders the 'Project' composition on Lambda and waits. Returns a time-limited download URL; pass outFile to also save the MP4. Use list_components / get_component_schema first to fill each clip's props.",
    inputSchema: {
      clips: z
        .array(
          z.object({
            componentId: z
              .string()
              .describe("Component id from list_components."),
            props: z
              .record(z.string(), z.unknown())
              .optional()
              .describe(
                "Props for this clip, merged over the component's defaults.",
              ),
            durationInFrames: z
              .number()
              .int()
              .positive()
              .optional()
              .describe(
                "Clip length; defaults to the component's natural length.",
              ),
            style: z
              .record(z.string(), z.unknown())
              .optional()
              .describe(
                "Universal Style overrides (background/color/fontFamily/accent).",
              ),
            transition: z
              .record(z.string(), z.unknown())
              .optional()
              .describe(
                "How this clip enters, e.g. { kind: 'fade', durationInFrames: 8 }. Ignored on the first clip.",
              ),
          }),
        )
        .min(1)
        .describe("Ordered clips to stitch into one video."),
      fps: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Project fps (default 60)."),
      width: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Project width (default 1920)."),
      height: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Project height (default 1080)."),
      scale: z
        .number()
        .positive()
        .optional()
        .describe("Resolution multiplier, 0.25–2 (default 1)."),
      outFile: z
        .string()
        .optional()
        .describe("Absolute path to also save the MP4 to."),
    },
  },
  async (args) => {
    try {
      const result = await renderProject(
        (args.clips as ProjectClipInput[] | undefined) ?? [],
        {
          fps: args.fps as number | undefined,
          width: args.width as number | undefined,
          height: args.height as number | undefined,
          scale: args.scale as number | undefined,
          outFile: args.outFile as string | undefined,
        },
      );
      return jsonText(result);
    } catch (err) {
      return errorText(err instanceof Error ? err.message : String(err));
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
