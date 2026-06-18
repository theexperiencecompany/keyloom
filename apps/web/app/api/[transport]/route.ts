import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { type ZodRawShape, z } from "zod";
import { getComponentSchema, listComponents } from "@/features/mcp/components";
import { getRenderStatus, startRender } from "@/features/mcp/render";
import { consumeRender } from "@/lib/account";
import { authenticateApiKey } from "@/lib/api-keys";

export const maxDuration = 60;

type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};
const jsonText = (value: unknown): ToolResult => ({
  content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
});
const errorText = (message: string): ToolResult => ({
  isError: true,
  content: [{ type: "text", text: message }],
});

const baseHandler = createMcpHandler(
  (server) => {
    // Cast registerTool through unknown: the SDK's Zod generic inference can
    // exceed TypeScript's instantiation depth. The SDK still validates inputs
    // against inputSchema at runtime. (Same workaround as the stdio server.)
    const register = (
      name: string,
      config: { title: string; description: string; inputSchema: ZodRawShape },
      handler: (
        args: Record<string, unknown>,
        extra: { authInfo?: { extra?: Record<string, unknown> } },
      ) => Promise<ToolResult>,
    ) => {
      (
        server.registerTool as unknown as (
          n: string,
          c: unknown,
          h: typeof handler,
        ) => void
      )(name, config, handler);
    };

    const userIdOf = (extra: {
      authInfo?: { extra?: Record<string, unknown> };
    }): string => String(extra.authInfo?.extra?.userId ?? "");

    register(
      "list_components",
      {
        title: "List video components",
        description:
          "List every video component you can fill and render — id, title, description, category, brand-locked flag. Call first to discover ids.",
        inputSchema: {},
      },
      async () => jsonText(listComponents()),
    );

    register(
      "get_component_schema",
      {
        title: "Get a component's field schema",
        description:
          "Get one component's fields, default props, agent notes, and natural dimensions. Read this before render_component so you fill props correctly.",
        inputSchema: { componentId: z.string() },
      },
      async (args) => {
        const schema = getComponentSchema(String(args.componentId ?? ""));
        return schema
          ? jsonText(schema)
          : errorText(`Unknown component "${args.componentId}".`);
      },
    );

    register(
      "render_component",
      {
        title: "Render a component to video",
        description:
          "Start rendering one component to an MP4 with the given props (merged over defaults). Returns a renderId + bucketName immediately — poll get_render_status with them until done. Counts one render against your plan quota.",
        inputSchema: {
          componentId: z.string(),
          props: z.record(z.string(), z.unknown()).optional(),
          fps: z.number().int().positive().optional(),
          durationInFrames: z.number().int().positive().optional(),
          scale: z.number().positive().optional(),
        },
      },
      async (args, extra) => {
        const userId = userIdOf(extra);
        if (!userId) return errorText("Unauthenticated.");
        const claim = await consumeRender(userId);
        if (!claim.ok) {
          return errorText(claim.reason ?? "Render not allowed.");
        }
        try {
          const started = await startRender(
            String(args.componentId ?? ""),
            (args.props as Record<string, unknown> | undefined) ?? {},
            {
              fps: args.fps as number | undefined,
              durationInFrames: args.durationInFrames as number | undefined,
              scale: args.scale as number | undefined,
            },
          );
          return jsonText({
            ...started,
            status: "rendering",
            rendersRemaining: claim.remaining,
            next: "Call get_render_status with this renderId and bucketName until done is true, then use the returned url.",
          });
        } catch (err) {
          return errorText(err instanceof Error ? err.message : String(err));
        }
      },
    );

    register(
      "get_render_status",
      {
        title: "Check a render's status",
        description:
          "Poll a render started by render_component. Returns { done, progress }, plus a downloadable url + filename once done is true.",
        inputSchema: {
          renderId: z.string(),
          bucketName: z.string(),
        },
      },
      async (args) => {
        try {
          return jsonText(
            await getRenderStatus(
              String(args.renderId ?? ""),
              String(args.bucketName ?? ""),
            ),
          );
        } catch (err) {
          return errorText(err instanceof Error ? err.message : String(err));
        }
      },
    );
  },
  {},
  { basePath: "/api", maxDuration: 60 },
);

/**
 * Gate every MCP request on a keyloom API key (`kl_live_…`) sent as
 * `Authorization: Bearer …`. verifyToken resolves the key to its owner; the
 * userId is threaded to tool handlers via authInfo.extra for quota accounting.
 */
const handler = withMcpAuth(
  baseHandler,
  async (_req, bearerToken) => {
    const auth = await authenticateApiKey(bearerToken);
    if (!auth) return undefined;
    return {
      token: bearerToken as string,
      clientId: auth.user.id,
      scopes: [],
      extra: { userId: auth.user.id },
    };
  },
  { required: true },
);

export { handler as GET, handler as POST, handler as DELETE };
