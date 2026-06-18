/**
 * Keyloom MCP server — the thin "face" over the feature logic in this folder.
 *
 * It exposes three deterministic tools (no LLM in the server; the MCP client's
 * model does the field-filling):
 *   - list_components       — what you can render
 *   - get_component_schema  — a component's fields + defaults + dimensions
 *   - render_component      — fill props → render on Lambda → get an MP4 URL
 *
 * Run it over stdio (env is loaded from apps/web/.env.local by bun):
 *   bun run features/mcp/server.ts
 * then point Claude Desktop / Cursor at that command. See README in this folder.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { type ZodRawShape, z } from "zod";
import { getComponentSchema, listComponents } from "./components";
import { renderComponent } from "./render";

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
      "Render one component to an MP4 with the given props (merged over the component's defaults). Renders on Lambda and waits for completion. Returns a time-limited download URL; pass outFile (absolute path) to also save the MP4 to disk.",
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
      const result = await renderComponent(
        String(args.componentId ?? ""),
        (args.props as Record<string, unknown> | undefined) ?? {},
        {
          fps: args.fps as number | undefined,
          durationInFrames: args.durationInFrames as number | undefined,
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
