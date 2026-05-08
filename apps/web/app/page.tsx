import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  CodeIcon,
  Copy01Icon,
  FilmRoll02Icon,
  PaintBrush02Icon,
} from "@hugeicons/core-free-icons"
import { compositions } from "@workspace/compositions/registry"
import { Button } from "@workspace/ui/components/button"
import { DocsHeader } from "@/components/docs-header"
import { FeaturedComponents } from "@/components/featured-components"

const features = [
  {
    icon: Copy01Icon,
    title: "Copy & paste",
    description:
      "Composable Remotion primitives you own. No opaque framework, no lock-in.",
  },
  {
    icon: CodeIcon,
    title: "Fully typed",
    description:
      "Strict TypeScript end-to-end — props, schemas, and registry entries.",
  },
  {
    icon: PaintBrush02Icon,
    title: "Themeable",
    description: "Tailwind-friendly tokens with light & dark modes baked in.",
  },
  {
    icon: FilmRoll02Icon,
    title: "Production-ready",
    description:
      "Render in the browser with the Remotion Player or ship to MP4 via the renderer.",
  },
]

export default function LandingPage() {
  const featured = compositions.slice(0, 6)

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] border-x border-dashed border-border">
      <DocsHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-dashed border-border">
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
        <div className="relative px-8 pt-28 pb-28 sm:pt-36 sm:pb-36">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <ExperienceMark className="size-20 text-foreground sm:size-24" />

            <h1 className="mt-8 text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
              Motion Studio
            </h1>
            <p className="mt-4 text-sm uppercase tracking-[0.24em] text-muted-foreground sm:text-[13px]">
              by TheExperienceCompany
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild>
                <Link href="/docs">
                  Get started
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    data-icon="inline-end"
                  />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/studio">Open Studio</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured components */}
      <section className="border-b border-dashed border-border px-8 py-20">
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
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden shrink-0 sm:inline-flex"
            >
              <Link href="/docs">
                View all
                <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
              </Link>
            </Button>
          </div>

          <FeaturedComponents items={featured} />
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-24">
        <div className="mx-auto max-w-3xl rounded-xl border border-dashed border-border bg-muted/20 px-8 py-14 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Start shipping motion in minutes.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Read the docs, copy a component, render your first scene.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/docs">
                Read the docs
                <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="https://github.com">GitHub</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dashed border-border px-8 py-10">
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

function ExperienceMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 2917 2596.22"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M1622.44,1140.82c-171.36,116.77-214.77,139.74-250.51,191.19-88.78,127.78-96.18,271.9-92.01,359.66,1.39,278.81-4.67,550.16-3.28,828.96,345.66-144.48,775.49-397.08,1117.5-839.93,68.11-88.19,764.29-974.32,434.76-1414.14C2695.02,87.86,2472.17,9.71,2254.13,1.54,1326.79-33.2,487.77,525.47,151.95,1112.23c-.64,1.11-1.56,2.73-2.75,4.82-56.35,99.39-220.72,389.36-113.89,545.22,53.95,78.7,156.78,93.64,176.29,96.47,112.38,16.33,205.45-35.61,318.43-100.97,148.27-85.77,222.63-128.25,223.66-128.93,110.8-73.03,292.45-136.35,469.59-269.7.29-.22-5.45,3.27-16.33,9.79-16.76,10.04-308.69,116.63-392.68,175.06-138.48,96.34-510.4,167.8-574.85,49.34-69.83-128.33,179.85-456.19,258.84-560.82.81-1.07,7.67-10.05,14.47-18.85,308.02-397.84,704.35-550.68,775.83-577.2,384.82-142.79,938.81-197.12,1020.11-21.19,74.44,161.1-142.59,420.43-321.91,558.68" />
      <path d="M725.26,1612.72c-105.2,54.94-195.14,88.06-247.42,105.65-176.06,59.25-231.77,31.96-238.14,11.15-8.55-27.91,185.41-97.96,209.92-107.51,74.32-28.93,99.49-36.77,163.57-65.08,45.32-20.02,142.4-66.15,243.52-144.05,10.95-8.43,20.07-15.38,32.22-25.92,40.11-34.77,90.72-81.39,132.73-158.34,37.83-69.29,49.93-165.83,54.05-252.52,4.09-.99,2.62,7.42,2.96,11.44,7.26,87.49,14.84,238.56,97.57,245.68,61.62,5.31,113.16-27.69,168.54-53.77,2.21-1.04,7.6-4.59,7.32,1.47-72.08,48.01-120.37,94.81-149.47,126.46-39.38,42.82-57.73,73.26-69.02,95.19-5.99,11.64-16.39,32.1-24.82,60.37-25.32,84.98-29.12,228.42-29.1,234.91,0,0,0,.16-.04.17-1.56.29-23.79-224.6-83.94-243.73-12.28-3.91-27.85-.72-31.49.75-14.21,5.71-110.82,90.76-238.97,157.68Z" />
    </svg>
  )
}
