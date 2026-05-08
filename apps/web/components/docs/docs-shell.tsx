import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ListViewIcon,
  Copy01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import type { Doc } from "@/lib/docs"
import { getAdjacent } from "@/lib/docs"

export function DocsShell({ doc }: { doc: Doc }) {
  const { prev, next } = getAdjacent(doc.slug)
  const Content = doc.Content

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-12 px-8 py-10 xl:px-12">
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

          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-4xl font-bold tracking-tight">
              {doc.meta.title}
            </h1>
            <div className="flex items-center gap-1 shrink-0">
              <button className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-[12px] font-medium text-foreground hover:bg-muted transition-colors">
                <HugeiconsIcon icon={Copy01Icon} size={12} />
                <span>Copy Page</span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={12}
                  className="text-muted-foreground"
                />
              </button>
              <NavButton href={prev?.href} label="Previous page" direction="prev" />
              <NavButton href={next?.href} label="Next page" direction="next" />
            </div>
          </div>

          <p className="text-lg leading-relaxed text-muted-foreground mb-8">
            {doc.meta.description}
          </p>

          <article>
            <Content />
          </article>

          <div className="flex justify-between border-t border-border pt-4 mt-12">
            {prev ? (
              <Link
                href={prev.href}
                className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
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
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>

      <aside className="hidden w-52 shrink-0 xl:block">
        <div className="sticky top-24">
          <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
            <HugeiconsIcon icon={ListViewIcon} size={13} />
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
          </ul>
        </div>
      </aside>
    </div>
  )
}

function NavButton({
  href,
  label,
  direction,
}: {
  href: string | undefined
  label: string
  direction: "prev" | "next"
}) {
  const icon = direction === "prev" ? ArrowLeft01Icon : ArrowRight01Icon
  const baseClass =
    "flex items-center justify-center size-7 rounded-md border border-border bg-muted/40 transition-colors"
  if (!href) {
    return (
      <button
        aria-label={label}
        disabled
        className={`${baseClass} text-muted-foreground/40 cursor-not-allowed`}
      >
        <HugeiconsIcon icon={icon} size={14} />
      </button>
    )
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className={`${baseClass} text-muted-foreground hover:bg-muted hover:text-foreground`}
    >
      <HugeiconsIcon icon={icon} size={14} />
    </Link>
  )
}
