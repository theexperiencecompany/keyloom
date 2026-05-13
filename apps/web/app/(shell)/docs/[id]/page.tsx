import { compositions } from "@workspace/compositions/registry";
import { notFound } from "next/navigation";
import { DocsShell } from "@/components/docs/docs-shell";
import { getDoc, staticDocs } from "@/lib/docs";

export function generateStaticParams() {
  return [
    ...compositions.map((c) => ({ id: c.id })),
    ...staticDocs.map((d) => ({ id: d.slug })),
  ];
}

export default async function ComponentDocsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = getDoc(id);
  if (!doc) notFound();
  return <DocsShell doc={doc} />;
}
