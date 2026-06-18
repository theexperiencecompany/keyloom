# MCP feature

An MCP (Model Context Protocol) server that lets any MCP client — Claude
Desktop, Cursor, etc. — fill a component's fields and render it to a video,
using the same Lambda render pipeline as the studio.

The **logic, types, and data live here**; `server.ts` is just the thin MCP
"face" that wires the tools to these functions. No LLM runs in the server — the
**client's** model reads the schema and fills the props.

## Files

| File | Role |
|---|---|
| `types.ts` | Shared data types (component summary/schema, render options/result). |
| `config.ts` | Reads the Lambda env config (region / serve URL / function name). |
| `components.ts` | `listComponents()` + `getComponentSchema(id)` from the registry. |
| `render.ts` | `renderComponent(id, props, opts)` — Lambda render + poll + presign + optional download. |
| `server.ts` | The MCP stdio server exposing the three tools. |

## Tools

- **`list_components`** → every renderable component (`id`, `title`, `description`, `category`, `brandLocked`).
- **`get_component_schema(componentId)`** → that component's `fields`, `defaultProps`, `agentNotes`, and natural dimensions. Read this before rendering.
- **`render_component(componentId, props?, fps?, durationInFrames?, scale?, outFile?)`** → renders on Lambda, waits, returns a presigned MP4 `url` (and a local `outFile` path when requested).

## Running

It renders on Lambda, so it needs the same env the studio export uses — set in
`apps/web/.env.local`:

```
REMOTION_AWS_REGION=…
REMOTION_LAMBDA_SERVE_URL=…
REMOTION_LAMBDA_FUNCTION_NAME=…
REMOTION_AWS_ACCESS_KEY_ID=…
REMOTION_AWS_SECRET_ACCESS_KEY=…
```

Start it over stdio (bun auto-loads `.env.local`):

```bash
bun run --cwd apps/web mcp
```

## Wiring a client (Claude Desktop / Cursor)

Add to the client's MCP config:

```json
{
  "mcpServers": {
    "keyloom-video": {
      "command": "bun",
      "args": ["run", "--cwd", "/ABSOLUTE/PATH/TO/aesthetic/apps/web", "mcp"]
    }
  }
}
```

Then ask the client, e.g. *"Fill MessageBubbles as a breakup convo, dark theme,
keyboard on, and render it."* — it will call `get_component_schema`, compose the
props, and call `render_component`.

## Notes / limits (v1)

- Renders **one component** at a time (no multi-clip timelines yet).
- Whoever runs the server pays the AWS render cost — keep it local/trusted for
  now. A hosted HTTP transport + auth is the natural next step.
- External `http(s)` image props aren't proxied yet (GitHub/Google CDNs can
  block Lambda IPs); prefer `staticFile` asset paths or data URLs in props.
