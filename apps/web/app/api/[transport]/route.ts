import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { type ZodRawShape, z } from "zod";
import { getComponentSchema, listComponents } from "@/features/mcp/components";
import {
  forkComponent,
  listUserForks,
  readComponentCode,
  writeComponentCode,
} from "@/features/mcp/components-edit";
import {
  getRenderStatus,
  startForkRender,
  startRender,
} from "@/features/mcp/render";
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
          const componentId = String(args.componentId ?? "");
          const props =
            (args.props as Record<string, unknown> | undefined) ?? {};
          const options = {
            fps: args.fps as number | undefined,
            durationInFrames: args.durationInFrames as number | undefined,
            scale: args.scale as number | undefined,
          };
          // A forked component (one of the user's edits) renders through the
          // "Project" composition; a built-in renders directly. Try fork first.
          const started =
            (await startForkRender(userId, componentId, props, options)) ??
            (await startRender(componentId, props, options));
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
          const status = await getRenderStatus(
            String(args.renderId ?? ""),
            String(args.bucketName ?? ""),
          );
          if (!status.done) {
            return jsonText({ done: false, progress: status.progress });
          }
          // Surface the short, copy-safe link as `url` — NOT the raw ~500-char
          // presigned S3 URL, which wraps in terminal clients and gets mangled
          // on copy. The short link re-presigns + redirects, so it always works
          // and never expires out from under the user.
          return jsonText({
            done: true,
            progress: 1,
            url: status.downloadUrl,
            filename: status.filename,
          });
        } catch (err) {
          return errorText(err instanceof Error ? err.message : String(err));
        }
      },
    );

    // ── Fork & edit ──────────────────────────────────────────────────────
    // Copy a built-in component, read its code, and rewrite it — so an external
    // agent can turn a component into exactly what the user needs.

    register(
      "copy_component",
      {
        title: "Copy a component to make your own",
        description:
          "Copy a built-in component (by its id from list_components) into your own editable version. Returns the new component's id + current code. Change it with edit_component, then make a video with render_component.",
        inputSchema: {
          componentId: z.string(),
          name: z.string().optional(),
        },
      },
      async (args, extra) => {
        const userId = userIdOf(extra);
        if (!userId) return errorText("Unauthenticated.");
        const forked = await forkComponent(
          userId,
          String(args.componentId ?? ""),
          args.name as string | undefined,
        );
        return forked
          ? jsonText(forked)
          : errorText(
              `Unknown component "${args.componentId}". Call list_components for valid ids.`,
            );
      },
    );

    register(
      "list_my_components",
      {
        title: "List your components",
        description:
          "List the components you've made (your editable copies) — id, name, what they were copied from, and last edit time.",
        inputSchema: {},
      },
      async (_args, extra) => {
        const userId = userIdOf(extra);
        if (!userId) return errorText("Unauthenticated.");
        return jsonText(await listUserForks(userId));
      },
    );

    register(
      "view_component",
      {
        title: "View a component's source",
        description:
          "Get the full source of a component — one of your own copies (by its id) or a built-in (to see how it's built before copying). View this before edit_component.",
        inputSchema: { id: z.string() },
      },
      async (args, extra) => {
        const userId = userIdOf(extra);
        if (!userId) return errorText("Unauthenticated.");
        const result = await readComponentCode(userId, String(args.id ?? ""));
        return result
          ? jsonText(result)
          : errorText(`No component "${args.id}".`);
      },
    );

    register(
      "edit_component",
      {
        title: "Edit one of your components",
        description:
          "Change one of your components by replacing its full source. Pass the COMPLETE file. It's validated before saving — on failure you get the error back so you can fix it and retry. Only works on your own copies (copy_component first).",
        inputSchema: { id: z.string(), code: z.string() },
      },
      async (args, extra) => {
        const userId = userIdOf(extra);
        if (!userId) return errorText("Unauthenticated.");
        const result = await writeComponentCode(
          userId,
          String(args.id ?? ""),
          String(args.code ?? ""),
        );
        return result.ok
          ? jsonText({ ok: true, id: result.id })
          : errorText(result.error);
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
