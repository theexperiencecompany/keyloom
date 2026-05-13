import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsShell } from "@/components/docs/docs-shell";
import { getDoc } from "@/lib/docs";

export function generateMetadata(): Metadata {
  const doc = getDoc("introduction");
  return {
    title: doc?.meta.title ?? "Documentation",
    description: doc?.meta.description,
  };
}

export default function DocsIntroductionPage() {
  const doc = getDoc("introduction");
  if (!doc) notFound();
  return <DocsShell doc={doc} />;
}
