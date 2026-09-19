import {
  compositions,
  compositionsById,
} from "@workspace/compositions/registry";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ComponentCode } from "@/components/docs/component-code";
import { SceneShowcase } from "@/components/gallery/scene-showcase";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const info = Object.hasOwn(compositionsById, id)
    ? compositionsById[id]
    : undefined;
  return info
    ? { title: info.title, description: info.description }
    : { title: "Scene not found" };
}

export default async function ScenePage({ params }: Props) {
  const { id } = await params;
  const info = compositionsById[id];
  if (!Object.hasOwn(compositionsById, id) || !info) notFound();
  const related = compositions
    .filter(
      (scene) =>
        scene.id !== id &&
        scene.category === info.category &&
        !scene.hideFromAgent,
    )
    .slice(0, 3);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <Link
          href="/components"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Back to Explore
        </Link>
        <SceneShowcase
          key={id}
          id={id}
          relatedIds={related.map((scene) => scene.id)}
        />
        <details className="mt-12 border-t border-border py-6">
          <summary className="cursor-pointer text-sm font-medium">
            View code
          </summary>
          <div className="mt-4 min-w-0">
            <p className="mb-4 text-sm text-muted-foreground">
              Building with React? Copy the source or read the{" "}
              <Link
                href={`/docs/${id}`}
                className="underline underline-offset-4"
              >
                developer reference
              </Link>
              .
            </p>
            <ComponentCode id={id} />
          </div>
        </details>
      </div>
    </AppShell>
  );
}
