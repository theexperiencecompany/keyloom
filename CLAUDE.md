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

## Universal Clip Style — every composition exposes the same 4 controls

Every clip in the Studio gets a "Style" section in the Inspector with **four
universal controls** that work on any composition that wires up the clip style:

- Background color
- Text color
- Font (Google Fonts picker)
- Accent color

The user expects these to *always* be there when they click a clip. Don't
hide them. Don't bake them into per-component fields. They're handled by the
shared infrastructure, not by individual `meta.ts` files.

### Architecture (don't break this)

- **`apps/remotion/src/clip-style.ts`** — declares `ClipStyle` (the four
  optional fields) and `resolveClipStyle(override, defaults)` helper. Empty
  strings count as "no override".
- **`apps/remotion/src/project.ts`** — `Clip.style?: ClipStyle` lives on
  every clip. The Studio reducer's `UPDATE_CLIP_STYLE` / `RESET_CLIP_STYLE`
  actions write here.
- **`apps/remotion/src/compositions/Project/Project.tsx`** — forwards
  `clip.style` to the rendered component as a `clipStyle` prop. A composition
  only reacts to it if it declares `clipStyle?: ClipStyle` and calls
  `resolveClipStyle`; one that ignores the prop simply keeps its own look.

### How to wire a new composition

Every new composition opts into universal styling with three lines:

```tsx
import { type ClipStyle, resolveClipStyle } from "../../clip-style";

export type FooProps = {
  // ...composition-specific props (text, value, theme, etc.)
  clipStyle?: ClipStyle;
};

export const Foo: React.FC<FooProps> = ({ /* ... */, clipStyle }) => {
  const s = resolveClipStyle(clipStyle, {
    background: "#f7f7f9",     // your composition's natural defaults
    color: "#0f1014",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    accent: "#6366f1",
  });

  return (
    <AbsoluteFill style={{ background: s.background, color: s.color, fontFamily: s.fontFamily }}>
      {/* use s.accent for highlights / icons / springs */}
    </AbsoluteFill>
  );
};
```

**Critical rules:**

1. Use the prop name `clipStyle` (NOT `style` — collides with React's HTML
   style prop and React will pass it through to DOM nodes by accident).
2. Call `resolveClipStyle()` at the top of the component and reference the
   returned `s.background / s.color / s.fontFamily / s.accent` everywhere
   you'd previously have used hardcoded values.
3. Do **not** add per-clip `accentColor` / `backgroundColor` / `fontFamily`
   fields to the composition's `meta.ts` `fields` array. The universal Style
   section handles all four. Per-component fields are only for
   composition-specific content (text, value, layout, etc.).
4. The first argument to `resolveClipStyle` is `clipStyle` (the override);
   the second is the composition's natural defaults. Don't swap them.

### Impersonators (brand-mimicking compositions)

> **Note:** the old `brandMode: "locked"` opt-out has been **removed**. Every
> composition — including impersonators that mimic real apps (Tweet, WhatsApp,
> Slack, Discord, iMessage, etc.) — now wires up the universal clip style like
> any other.

To keep an authentic look while still opting into universal styling, pass the
brand's real colors/fonts as the **defaults** to `resolveClipStyle`:

```tsx
const s = resolveClipStyle(clipStyle, {
  background: "#ffffff",   // the app's authentic look as the *default*
  color: "#0f1419",
  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
  accent: "#1d9bf0",       // Twitter blue, WhatsApp green, etc.
});
```

The composition then looks authentic out of the box, but the user can still
override any of the four controls. For multiple hand-built skins (iMessage vs.
Liquid Glass), declare `themes` (see below) instead of hardcoding.

### Curated themes (`meta.themes`)

Separate from the four free-form controls, any composition can declare
curated, named skins via `themes` in its `meta.ts`. A theme is a hand-built
look (materials, blur, bubble shapes, chrome), not arbitrary recoloring —
ideal for impersonators that need more than the four universal controls.

```ts
export const messageBubblesInfo: CompositionInfo<MessageBubblesProps> = {
  // ...
  themes: [
    { id: "imessage", label: "iMessage" },           // first = default look
    { id: "glass", label: "Liquid Glass" },
  ],
};
```

How it works:

- The Inspector's Style section renders a **Theme picker** whenever a
  composition declares `themes`. The first entry is the default look —
  selecting it clears the override.
- The choice is stored at `clip.style.theme`. `Project.tsx` validates the
  id against `info.themes` and forwards it to the component as a separate
  `clipTheme?: string` prop. The component branches on its non-default
  theme ids:

  ```tsx
  export type FooProps = { /* ... */ clipTheme?: string };
  // in render: if (clipTheme === "glass") return <GlassVariant ... />;
  ```

- Do **not** add a `theme` select to the `fields` array — the universal
  Theme picker handles it.
- Theme visuals must survive `@remotion/web-renderer` exports: build the
  base look from rgba fills, linear gradients, borders and shadows;
  `backdrop-filter` is allowed only as progressive enhancement.

## Remotion Composition Registry

`apps/remotion/src/components.ts` uses a two-level split to avoid circular dependencies:

- **`componentsBase.ts`** — standalone compositions that do NOT import `componentsById` or `componentsByIdBase`. Add new plain compositions here.
- **`components.ts`** — spreads `componentsByIdBase` and adds wrapper compositions (`PhoneFrame`, `LaptopFrame`, `SplitScene`) that need to look up other compositions at render time.

Wrapper compositions (any component that embeds other compositions via `componentsByIdBase`) must:
1. Import from `componentsBase.ts`, never from `components.ts`
2. Live in `components.ts` (not in `componentsBase.ts`)

Violating this causes a circular-import TDZ crash at runtime.

## Static Assets

`apps/web/public/` is the **single source of truth** for every static asset (images, audio, fonts, logos, MP3 samples). `apps/remotion/public/` is a symlink to `../web/public`, so both apps see the same tree.

When a composition references an asset via `staticFile()` (e.g. `staticFile("images/logos/aryan-avatar.png")`), the path is rooted at `apps/web/public/`. Drop new assets there only — do NOT create a real directory at `apps/remotion/public/`, or the studio Player and the in-browser export (which load from the Next dev server's public dir) will 404 on assets that only exist on the Remotion side.

## Adding a Composition — Required Sync Points

`apps/remotion/src/registry.ts → compositions[]` is the **single source of truth** for *metadata* (what surfaces list & describe a composition), and `apps/remotion/src/componentsBase.ts → componentsByIdBase` is the source of truth for the *render lookup* (what actually draws on the canvas). The studio Library, ⌘K palette, `/component/[id]/edit`, and the home grid read from the registry. **You must update BOTH** — registering only the meta makes the composition show up in lists but renders a **"Missing scene — No component registered for id …"** placeholder.

Adding a composition requires these files **plus a generator step**:

1. **`apps/remotion/src/compositions/<Name>/<Name>.tsx`** — the React component. Export a named `<Name>` matching the `id`. Wire up the universal clip style (see "Universal Clip Style" above) unless the composition is locked-by-design.
2. **`apps/remotion/src/compositions/<Name>/meta.ts`** — exports `<name>Info: CompositionInfo<Props>` with a unique PascalCase `id`, `title`, `description`, `category`, dimensions, `defaultProps`, and `fields`.
3. **`apps/remotion/src/registry.ts`** — `import { <name>Info }` and add it to the `compositions[]` array.
4. **`apps/remotion/src/componentsBase.ts`** — `import { <Name> }` and add it to the `componentsByIdBase` map (keyed by `id`). Wrapper compositions that embed other compositions go in `components.ts` instead, never here (see "Remotion Composition Registry" above).
5. **Regenerate `apps/web/lib/generated-sources.ts`** — run `bun run --cwd apps/web sources`. **This step is mandatory**, see below.

### Required: regenerate `generated-sources.ts`

The studio's in-browser renderer (and the fork/edit + export pipeline) does **not** import compositions as live modules — it reads each composition's source code as a string from `apps/web/lib/generated-sources.ts`, an auto-generated file (`scripts/generate-sources.mjs`). If you skip this, the composition shows up in the Library/⌘K (those read the registry) but the **canvas renders "Missing scene — No component registered for id …"** because the renderer's source map has no entry for it.

```bash
bun run --cwd apps/web sources   # rewrites generated-sources.ts from the registry
```

Re-run it any time you add a composition or change an existing composition's source. Never hand-edit `generated-sources.ts` — it has an `AUTO-GENERATED … Do not edit by hand` header.

### ⌘K palette

Press ⌘K (or Ctrl+K) anywhere in the studio. Searches across registered compositions and studio actions (export, screenshot, save, import, play, audio). The palette reads from `registry.compositions`, so anything you register surfaces automatically.
