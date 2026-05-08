"use client";

import {
  Moon02Icon,
  NewTwitterIcon,
  Search01Icon,
  StarIcon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { useTheme } from "next-themes";
import * as React from "react";
import { BrandLink } from "@/components/brand-link";
import { DocsSearch } from "@/components/docs-search";

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 98 96"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
      />
    </svg>
  );
}

function formatStars(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

function GitHubButton() {
  const [stars, setStars] = React.useState<number | null>(null);

  React.useEffect(() => {
    fetch("https://api.github.com/repos/theexperiencecompany/motion-studio")
      .then((r) => r.json())
      .then((data: { stargazers_count?: number }) => {
        if (typeof data.stargazers_count === "number") {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <Button variant="ghost" size="sm" className="gap-1.5 px-2" asChild>
      <Link
        href="https://github.com/theexperiencecompany/motion-studio"
        title="GitHub"
        target="_blank"
        rel="noopener noreferrer"
      >
        {stars !== null && (
          <>
            <HugeiconsIcon icon={StarIcon} className="size-4 text-yellow-400" />
            <span className="text-xs tabular-nums">{formatStars(stars)}</span>
          </>
        )}
        <GitHubMark className="size-4" />
      </Link>
    </Button>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      title="Toggle theme"
    >
      <HugeiconsIcon icon={Sun03Icon} className="size-4 hidden dark:block" />
      <HugeiconsIcon icon={Moon02Icon} className="size-4 block dark:hidden" />
    </Button>
  );
}

const navLinks = [
  { label: "Docs", href: "/docs" },
  { label: "Studio", href: "/studio" },
];

export function DocsHeader() {
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-dashed border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center gap-6 px-8">
          {/* Logo */}
          <BrandLink />

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            {/* Search */}
            <Button
              variant="outline"
              size="sm"
              className="w-48 justify-start gap-2 text-muted-foreground"
              onClick={() => setSearchOpen(true)}
            >
              <HugeiconsIcon icon={Search01Icon} size={13} />
              <span className="flex-1 text-left text-[13px]">
                Search docs...
              </span>
              <kbd className="font-mono text-[11px] text-muted-foreground/60">
                ⌘K
              </kbd>
            </Button>

            <div className="flex items-center gap-0.5">
              <ThemeToggle />

              {/* GitHub */}
              <GitHubButton />

              {/* Twitter/X */}
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href="https://x.com/madebyexp" title="X (Twitter)">
                  <HugeiconsIcon icon={NewTwitterIcon} className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <DocsSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
