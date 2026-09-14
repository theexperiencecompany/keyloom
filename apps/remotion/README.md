# @workspace/compositions

The Keyloom composition library: every Remotion scene the studio can drop on
the timeline (chat mockups, charts, text animations, device frames, captions,
backgrounds), the `Project` composition that stitches clips together, the
registry that describes them, and the shared editor primitives the Inspector
renders for each one.

## How it is consumed

`apps/web` depends on this package as `@workspace/compositions` and imports
straight from `src/` (see `exports` in `package.json` and the
`@workspace/compositions/*` path alias in `apps/web/tsconfig.json`):

- `@workspace/compositions/registry` — `compositions[]` metadata that drives
  the Library, the command palette, docs and the agent catalog.
- `@workspace/compositions/components` — the `componentsById` render lookup.
- `@workspace/compositions/project`, `schema`, `clip-style`, `transitions`,
  `effects/*`, `editors` — types and helpers shared with the studio.

The studio also renders composition **source** as strings for forking and
in-browser export; that map (`apps/web/lib/generated-sources.ts`) is produced
by `bun run --cwd apps/web sources` and must be regenerated whenever a
composition is added or its source changes.

`public/` is a symlink to `apps/web/public` — static assets live there only.

## Adding a composition

Follow the checklist in the repo root `CLAUDE.md` ("Adding a Composition —
Required Sync Points"): component + `meta.ts`, register in `registry.ts` and
`componentsBase.ts` (wrappers that embed other compositions go in
`components.ts`), wire up the universal clip style, then regenerate sources.

## Scripts

```bash
bun run dev              # Remotion Studio for this package
bun run build            # remotion bundle
bun run typecheck        # tsc --noEmit
bun run lint             # biome check
bun run deploy:site      # remotion lambda sites create (site: motion-studio)
bun run deploy:function  # remotion lambda functions deploy
```

The Lambda commands need `@remotion/lambda` resolvable from this package (it
is a dependency here for that reason) and AWS credentials in the environment.
