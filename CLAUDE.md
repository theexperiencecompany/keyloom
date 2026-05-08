# Project Guidelines

## Icons

Always use **HugeIcons** for all icons. Never use `lucide-react`, inline SVGs, or any other icon library.

```tsx
import { HugeiconsIcon } from "@hugeicons/react"
import { SomeIcon } from "@hugeicons/core-free-icons"

<HugeiconsIcon icon={SomeIcon} size={16} />
```

## UI Components & Styling

- Always use **shadcn/ui** components with their default styling (`Button`, `Input`, `Select`, `Accordion`, etc.)
- Never use raw Radix UI primitives directly — always wrap them in shadcn-style components from `@workspace/ui/components/*`
- Never use raw HTML `<input>`, `<button>`, `<select>`, etc. with custom styling unless explicitly requested
- Always use **Tailwind** utility classes for layout and spacing — no inline styles unless required by a third-party API (e.g. Remotion player dimensions)

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
