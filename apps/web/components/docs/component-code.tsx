import { compositionsById } from "@workspace/compositions/registry";
import { compositionSources } from "@/lib/generated-sources";
import { CodeBlockClient } from "./code-block-client";

/**
 * Renders the React source of a composition so users can copy / download it
 * — like shadcn docs. Sources are baked into a generated module at build
 * time so this works in the client bundle without runtime Node fs.
 */
export function ComponentCode({ id }: { id: string }) {
  const info = compositionsById[id];
  const source = compositionSources[id];
  if (!info || !source) {
    return (
      <div className="not-prose my-6 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        Source for &ldquo;{id}&rdquo; isn&rsquo;t available. Re-run{" "}
        <code className="font-mono">bun run --cwd apps/web sources</code> after
        adding the composition.
      </div>
    );
  }

  const tabs = [
    {
      label: `${id}.tsx`,
      path: `compositions/${id}/${id}.tsx`,
      source: source.component,
    },
    ...(source.meta
      ? [
          {
            label: "meta.ts",
            path: `compositions/${id}/meta.ts`,
            source: source.meta,
          },
        ]
      : []),
  ];

  return <CodeBlockClient tabs={tabs} downloadBaseName={id} />;
}
