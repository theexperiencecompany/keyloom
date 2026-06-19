import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsShell } from "@/components/docs/docs-shell";
import { getDoc } from "@/lib/docs";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getDoc("introduction");
  return {
    title: doc?.meta.title ?? "Documentation",
    description: doc?.meta.description,
  };
}

export default async function DocsIntroductionPage() {
  const doc = await getDoc("introduction");
  if (!doc) notFound();
  return <DocsShell doc={doc} />;
}
