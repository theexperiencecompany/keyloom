import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { compositions } from "@workspace/compositions/registry"
import { DocsHeader } from "@/components/docs-header"

const features = [
  {
    title: "Copy & paste",
    description:
      "Composable Remotion primitives you own. No opaque framework, no lock-in.",
  },
  {
    title: "Fully typed",
    description:
      "Strict TypeScript end-to-end — props, schemas, and registry entries.",
  },
  {
    title: "Themeable",
    description:
      "Tailwind-friendly tokens with light & dark modes baked in.",
  },
  {
    title: "Production-ready",
    description:
      "Render in the browser with the Remotion Player or ship to MP4 via the renderer.",
  },
]

export default function LandingPage() {
  const featured = compositions.slice(0, 6)

  return (
    <div className="mx-auto max-w-[1600px] border-x border-dashed border-white/10 min-h-screen">
      <DocsHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-dashed border-white/10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 0%, rgba(120,120,255,0.15), transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(circle at 50% 30%, black 0%, transparent 70%)",
          }}
        />
        <div className="relative px-8 pt-24 pb-28 sm:pt-32 sm:pb-36">
          <div className="mx-auto max-w-3xl text-center">
            <Link
              href="/docs/changelog"
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium text-background">
                v1.0
              </span>
              <span>Initial release is out</span>
              <ArrowRight size={12} />
            </Link>

            <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
              Beautifully designed motion components.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
              A collection of Remotion components and templates you can drop
              into your video pipeline. Copy, paste, render.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Get started
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-border hover:bg-muted"
              >
                Open Studio
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-dashed border-white/10 px-8 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything you need to ship video.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Stop reinventing transitions. These components are built for
              Remotion and tuned for production rendering.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-dashed border-white/10 bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="bg-background p-6">
                <div className="mb-3 size-8 rounded-md border border-dashed border-white/10 bg-muted/30" />
                <h3 className="text-sm font-medium">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured components */}
      <section className="border-b border-dashed border-white/10 px-8 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Browse the components.
              </h2>
              <p className="mt-3 text-muted-foreground">
                A growing library of titles, overlays, and templates.
              </p>
            </div>
            <Link
              href="/docs"
              className="hidden shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              View all
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
              <Link
                key={c.id}
                href={`/docs/${c.id}`}
                className="group relative overflow-hidden rounded-lg border border-border/60 bg-muted/20 p-5 transition-colors hover:border-border hover:bg-muted/40"
              >
                <div className="aspect-video w-full rounded-md border border-dashed border-white/10 bg-background" />
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{c.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {c.id}
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-24">
        <div className="mx-auto max-w-3xl rounded-xl border border-dashed border-white/10 bg-muted/20 px-8 py-14 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Start shipping motion in minutes.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Read the docs, copy a component, render your first scene.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Read the docs
              <ArrowRight size={14} />
            </Link>
            <Link
              href="https://github.com"
              className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-border hover:bg-muted"
            >
              GitHub
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dashed border-white/10 px-8 py-10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="size-4 rounded bg-foreground" />
            <span>motioncrow</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/docs" className="hover:text-foreground">
              Docs
            </Link>
            <Link href="/studio" className="hover:text-foreground">
              Studio
            </Link>
            <Link href="https://github.com" className="hover:text-foreground">
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
