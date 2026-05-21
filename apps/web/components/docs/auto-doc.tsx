import { CompositionStats } from "@/components/docs/composition-stats";
import { EditorLink } from "@/components/docs/editor-link";
import { Preview } from "@/components/docs/preview";
import { PropsTable } from "@/components/docs/props-table";

/**
 * Default documentation page generated entirely from a composition's
 * registry metadata. Used as the fallback for any composition that doesn't
 * ship a hand-written MDX file under `content/docs/<kebab>.mdx`.
 *
 * Adding a bespoke MDX file with the matching kebab-case filename
 * automatically replaces this — see `lib/docs.ts`.
 */
export function AutoDoc({
  id,
  description,
}: {
  id: string;
  description?: string;
}) {
  return (
    <>
      <h2 id="preview">Preview</h2>
      {description ? <p>{description}</p> : null}
      <Preview id={id} />
      <EditorLink id={id} />
      <h2 id="props">Props</h2>
      <PropsTable id={id} />
      <h2 id="composition">Composition</h2>
      <CompositionStats id={id} />
    </>
  );
}
