import Link from "next/link";
import { notFound } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import {
  compositions,
  compositionsById,
} from "@workspace/compositions/registry";
import { EditorView } from "./EditorView";

export function generateStaticParams() {
  return compositions.map((c) => ({ id: c.id }));
}

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const info = compositionsById[id];
  if (!info) notFound();

  return (
    <div className="flex min-h-screen flex-col lg:h-screen">
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
        <Link
          href={`/docs/${info.id}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          Back to docs
        </Link>
        <h1 className="text-sm font-medium">{info.title}</h1>
        <div className="w-[100px]" />
      </header>
      <EditorView info={info} />
    </div>
  );
}
