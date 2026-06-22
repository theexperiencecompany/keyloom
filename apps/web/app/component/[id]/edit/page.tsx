import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { compositionsById } from "@workspace/compositions/registry";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditorView } from "./EditorView";
import { ForkEditorView } from "./ForkEditorView";

// Render editor pages ON DEMAND instead of statically prerendering all 79
// compositions at build time. It's an interactive client editor (zero SEO
// value), and prerendering every composition — each mounting the full Remotion
// graph — was a large, pointless chunk of the build. First request renders +
// caches; nothing else changes for the user.
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const composition = compositionsById[id];
  if (!composition) return { title: "Not found" };
  return {
    title: `Edit ${composition.title}`,
    description: composition.description,
  };
}

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);

  // Forked ("custom:") components live in the user's client-side library, not
  // the static registry — hand off to the client editor which loads + edits
  // them (Player + props + agent). It renders its own header.
  if (id.startsWith("custom:")) {
    return <ForkEditorView id={id} />;
  }

  const composition = compositionsById[id];
  if (!composition) notFound();

  // Strip non-serializable fields (calculateMetadata is a function)
  // before passing to the "use client" EditorView.
  const { calculateMetadata: _cm, ...info } = composition;

  return (
    <div className="flex min-h-screen flex-col lg:h-screen">
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          Back to components
        </Link>
        <h1 className="text-sm font-medium">{info.title}</h1>
        <div className="w-[100px]" />
      </header>
      <EditorView info={info} />
    </div>
  );
}
