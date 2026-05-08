# Project Guidelines

## Commits & PRs

Never mention Claude, Claude Code, or any AI assistant in commit messages, PR titles, PR descriptions, or PR comments. No `Co-Authored-By: Claude …` trailers, no "🤖 Generated with Claude Code" footers, no references to AI tooling anywhere in version control history. Write commits and PRs as if a human wrote them.

## Icons

Always use **HugeIcons** for all icons. Never use `lucide-react`, inline SVGs, or any other icon library.

```tsx
import { HugeiconsIcon } from "@hugeicons/react"
import { SomeIcon } from "@hugeicons/core-free-icons"

<HugeiconsIcon icon={SomeIcon} size={16} />
```

## UI Components & Styling

- Always use **shadcn/ui** components with their default styling (`Button`, `Input`, `Select`, `Accordion`, etc.)
- **Never hand-write UI components.** Always add new components via the shadcn CLI:
  ```bash
  cd packages/ui && bunx shadcn@latest add <component>
  ```
- Never use raw Radix UI primitives directly — always wrap them in shadcn-style components from `@workspace/ui/components/*`
- Never use raw HTML `<input>`, `<button>`, `<select>`, etc. with custom styling unless explicitly requested
- Always use **Tailwind** utility classes for layout and spacing — no inline styles unless required by a third-party API (e.g. Remotion player dimensions)
- The `Accordion` component in `@workspace/ui/components/accordion` uses minimal sidebar-friendly defaults (no border/rounded-2xl on root, no heavy padding on trigger). Use `className` overrides to adapt for card-style contexts if needed.

## Type Checking

Always run `bun run tsc --noEmit` (or `bun run --cwd <package> tsc --noEmit`) after completing any changes and fix all new TypeScript errors before reporting done.

## Remotion Composition Registry

`apps/remotion/src/components.ts` uses a two-level split to avoid circular dependencies:

- **`componentsBase.ts`** — standalone compositions that do NOT import `componentsById` or `componentsByIdBase`. Add new plain compositions here.
- **`components.ts`** — spreads `componentsByIdBase` and adds wrapper compositions (`PhoneFrame`, `LaptopFrame`, `SplitScene`) that need to look up other compositions at render time.

Wrapper compositions (any component that embeds other compositions via `componentsByIdBase`) must:
1. Import from `componentsBase.ts`, never from `components.ts`
2. Live in `components.ts` (not in `componentsBase.ts`)

Violating this causes a circular-import TDZ crash at runtime.

## Adding a Composition — Required Sync Points

When you add a new composition under `apps/remotion/src/compositions/<Name>/`, **all** of these must be updated in the same change. Skipping any one of them leaves the composition partially wired (silently missing from docs, broken in the studio, or invisible in the registry):

1. **`apps/remotion/src/compositions/<Name>/<Name>.tsx`** — the React component.
2. **`apps/remotion/src/compositions/<Name>/meta.ts`** — exports `<name>Info: CompositionInfo<Props>` with `id`, `title`, `description`, dimensions, `defaultProps`, `fields`. The `id` must be a unique PascalCase string.
3. **`apps/remotion/src/registry.ts`** — import the `<name>Info` and add it to the `compositions` array. This drives the studio Library, the docs sidebar, and `generateStaticParams` for `/docs/[id]` and `/component/[id]/edit`.
4. **`apps/remotion/src/componentsBase.ts`** (or **`components.ts`** for wrapper compositions) — import the component and add it to `componentsByIdBase` (or the wrapper map). The `<Project>` composition and the renderer look the component up by `id` from this map; missing here = silent black screen in the timeline / studio export.
5. **`apps/web/content/docs/<kebab-name>.mdx`** — docs page. Mirror an existing one: `meta` export with `title`, `description`, `toc`, plus the `<Preview id />`, `<EditorLink id />`, `<PropsTable id />`, `<CompositionStats id />` blocks. The filename is the kebab-case form of the id.
6. **`apps/web/lib/docs.ts`** — import the MDX module + `meta as <camel>Meta`, then add a `Doc` entry with `slug` (= the composition id), `href` (`/docs/<id>`), `meta`, and `Content`. Order matters: the entry's position determines prev/next nav order.

Quick sanity check after the change:

```bash
# Every registered composition id should also appear as a slug in lib/docs.ts.
grep '  id:' apps/remotion/src/compositions/*/meta.ts \
  | grep -oE '"[^"]+"' | tr -d '"' | sort -u > /tmp/ids.txt
grep -oE 'slug: "[A-Z][a-zA-Z]+"' apps/web/lib/docs.ts \
  | sed 's/slug: "//;s/"$//' | sort -u > /tmp/slugs.txt
comm -23 /tmp/ids.txt /tmp/slugs.txt   # should print nothing
```

If that command prints anything, those compositions are registered in Remotion but don't have a docs page wired up.
