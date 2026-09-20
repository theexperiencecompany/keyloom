"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLink } from "@/components/brand-link";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { label: "Explore", short: "Explore", href: "/components" },
  { label: "My Projects", short: "Projects", href: "/components/projects" },
  { label: "Help", short: "Help", href: "/help" },
];

/**
 * Shell for browsing surfaces (Explore, scene showcases, projects, help): a
 * slim top bar and full-width content. The working tools (Studio, Memes,
 * Split Screen, Captions) keep the sidebar from `AppShell`.
 */
export function BrowseShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Longest matching href wins so Explore doesn't light up on /components/projects.
  const activeHref = LINKS.filter((l) =>
    l.href === "/components"
      ? pathname === l.href || pathname.startsWith("/component/")
      : pathname === l.href || pathname.startsWith(`${l.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-4 sm:gap-4 sm:px-8 lg:px-10">
          <BrandLink />
          <nav className="flex items-center gap-0.5 sm:ml-4">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] font-medium transition-colors sm:px-3 sm:text-sm",
                  l.href === activeHref
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="sm:hidden">{l.short}</span>
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              asChild
              size="sm"
              className="hidden rounded-full sm:inline-flex"
            >
              <Link href="/studio">
                <HugeiconsIcon icon={PlusSignIcon} size={14} />
                New project
              </Link>
            </Button>
            <Button
              asChild
              size="icon-sm"
              className="rounded-full sm:hidden"
              aria-label="New project"
            >
              <Link href="/studio">
                <HugeiconsIcon icon={PlusSignIcon} size={16} />
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-5 pb-16 sm:px-8 lg:px-10">
        {children}
      </main>
    </div>
  );
}
