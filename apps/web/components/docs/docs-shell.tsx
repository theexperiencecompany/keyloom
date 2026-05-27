import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ArrowLeft02Icon,
  ArrowRight01Icon,
  ArrowRight02Icon,
  Books02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { compositionsById } from "@workspace/compositions/registry";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Button } from "@workspace/ui/components/button";
import Image from "next/image";
import Link from "next/link";
import type { Doc } from "@/lib/docs";
import { getAdjacent } from "@/lib/docs";
import { ComponentCode } from "./component-code";
import { CopyPageButton } from "./copy-page-button";

function slugToFilename(slug: string): string {
  return slug.replace(/[A-Z]/g, (ch, offset: number) =>
    offset === 0 ? ch.toLowerCase() : `-${ch.toLowerCase()}`,
  );
}

export function DocsShell({ doc }: { doc: Doc }) {
  const { prev, next } = getAdjacent(doc.slug);
  const Content = doc.Content;

  const filename = slugToFilename(doc.slug);
  let rawContent = "";
  try {
    rawContent = readFileSync(
      join(process.cwd(), "content/docs", `${filename}.mdx`),
      "utf-8",
    );
  } catch {
    rawContent = "";
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-12 px-4 py-8 sm:px-6 md:py-10 lg:px-8 xl:px-12">
      <div className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-3xl">
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{doc.meta.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mb-4 flex items-center justify-between gap-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {doc.meta.title}
            </h1>
            <div className="flex shrink-0 items-center gap-1">
              <CopyPageButton content={rawContent} />
              <NavButton
                href={prev?.href}
                label="Previous page"
                direction="prev"
              />
              <NavButton href={next?.href} label="Next page" direction="next" />
            </div>
          </div>

          <p className="text-lg leading-relaxed text-muted-foreground mb-8">
            {doc.meta.description}
          </p>

          <article>
            <Content />
          </article>

          {compositionsById[doc.slug] && (
            <section id="source" className="mt-12">
              <h2 className="text-2xl font-semibold tracking-tight scroll-mt-24 mt-12 mb-2">
                Source
              </h2>
              <p className="text-[15px] leading-relaxed text-muted-foreground mb-4">
                Copy or download the React source — drop it into your own
                Remotion project. The only runtime dependency is{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">
                  remotion
                </code>
                .
              </p>
              <ComponentCode id={doc.slug} />
            </section>
          )}

          <div className="flex justify-between border-t border-border pt-4 mt-12">
            {prev ? (
              <Link
                href={prev.href}
                className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <HugeiconsIcon icon={ArrowLeft02Icon} size={14} />
                {prev.label}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={next.href}
                className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {next.label}
                <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>

      <aside className="hidden w-52 shrink-0 xl:block">
        <div className="sticky top-24 space-y-6">
          <div>
            <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground/60">
              <HugeiconsIcon icon={Books02Icon} size={13} />
              <span>On This Page</span>
            </div>
            <ul className="space-y-2 border-l border-dashed border-border pl-3">
              {doc.meta.toc.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t.label}
                  </a>
                </li>
              ))}
              {compositionsById[doc.slug] && (
                <li>
                  <a
                    href="#source"
                    className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Source
                  </a>
                </li>
              )}
            </ul>
          </div>

          <Link
            href="https://heygaia.io"
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-2xl bg-muted/60 p-4 transition-colors hover:bg-muted/80 dark:bg-muted/15 dark:hover:bg-muted/25"
          >
            <div className="mb-2 flex items-center gap-2">
              <Image
                src="/gaia_logo.png"
                alt="GAIA"
                width={24}
                height={24}
                className="rounded-sm"
              />
              <span className="text-[12px] font-semibold text-foreground">
                GAIA
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Motion Studio is the commercial reel kit for GAIA, the personal AI
              assistant.
            </p>
            <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground/80 transition-colors group-hover:text-foreground">
              heygaia.io
              <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
            </span>
          </Link>
        </div>
      </aside>
    </div>
  );
}

function NavButton({
  href,
  label,
  direction,
}: {
  href: string | undefined;
  label: string;
  direction: "prev" | "next";
}) {
  const icon = direction === "prev" ? ArrowLeft02Icon : ArrowRight02Icon;
  if (!href) {
    return (
      <Button variant="outline" size="icon-sm" aria-label={label} disabled>
        <HugeiconsIcon icon={icon} size={14} />
      </Button>
    );
  }
  return (
    <Button variant="outline" size="icon-sm" asChild>
      <Link href={href} aria-label={label}>
        <HugeiconsIcon icon={icon} size={14} />
      </Link>
    </Button>
  );
}
