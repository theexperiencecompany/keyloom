import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-dashed border-border bg-background/80">
      <div className="mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/clapperboard.png"
            alt=""
            aria-hidden
            width={20}
            height={20}
            className="size-5"
          />
          <span className="font-semibold text-foreground">Motion Studio</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-muted-foreground">
          <Link
            href="/docs"
            className="transition-colors hover:text-foreground"
          >
            Docs
          </Link>
          <Link
            href="/docs/components"
            className="transition-colors hover:text-foreground"
          >
            Components
          </Link>
          <Link
            href="/studio"
            className="transition-colors hover:text-foreground"
          >
            Studio
          </Link>
          <Link
            href="/docs/contributors"
            className="transition-colors hover:text-foreground"
          >
            Contributors
          </Link>
          <a
            href="https://github.com/theexperiencecompany/motion-studio"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
          <a
            href="https://heygaia.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <Image
              src="/gaia_logo.png"
              alt=""
              aria-hidden
              width={16}
              height={16}
              className="size-4 rounded-sm"
            />
            GAIA
          </a>
        </nav>

        <p className="text-[12px] tabular-nums text-muted-foreground">
          © {year} The Experience Company · MIT
        </p>
      </div>
    </footer>
  );
}
