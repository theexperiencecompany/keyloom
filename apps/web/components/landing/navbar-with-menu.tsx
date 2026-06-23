"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { Button } from "@workspace/ui/components/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@workspace/ui/components/navigation-menu";
import { RaisedButton } from "@workspace/ui/components/raised-button";
import { cn } from "@workspace/ui/lib/utils";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

export type NavMenuLink = {
  label: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
  external?: boolean;
  /** Span two rows in the dropdown grid — used for tall featured cards. */
  rowSpan?: number;
  /** When set, the link renders as a full-bleed featured card. */
  backgroundImage?: string;
};

export type NavMenuSection = {
  id: string;
  label: string;
  /** When set, the item is a plain link instead of a dropdown trigger. */
  href?: string;
  /** Tailwind grid classes for the dropdown panel (give it an explicit width). */
  gridLayout?: string;
  links?: NavMenuLink[];
};

// Auth-aware primary CTA: signed in → "Create" (jump into the studio),
// signed out → "Login". Loading shows a neutral disabled button so the navbar
// doesn't shift when auth resolves.
function AuthCta() {
  const { user, loading } = useAuth();

  const blue =
    "border-blue-600/50 bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600";

  if (loading) {
    return (
      <RaisedButton size="sm" className={blue} disabled>
        Create
      </RaisedButton>
    );
  }

  return (
    <RaisedButton
      size="sm"
      className={blue}
      onClick={() => {
        window.location.href = user ? "/studio" : "/api/auth/signin";
      }}
    >
      {user ? "Create" : "Login"}
    </RaisedButton>
  );
}

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

function FeaturedCard({ link }: { link: NavMenuLink }) {
  return (
    <div className="relative h-full min-h-[10rem] w-full overflow-hidden rounded-2xl">
      <Image
        src={link.backgroundImage as string}
        alt=""
        aria-hidden
        fill
        sizes="20rem"
        className="object-cover transition-transform duration-500 group-hover/card:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
      <div className="relative flex h-full flex-col justify-between p-4 text-white">
        {link.icon ? (
          <span className="flex size-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
            {link.icon}
          </span>
        ) : (
          <span />
        )}
        <div>
          <div className="text-sm font-semibold">{link.label}</div>
          {link.description ? (
            <p className="mt-0.5 text-xs leading-snug text-white/70">
              {link.description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PlainLink({ link }: { link: NavMenuLink }) {
  return (
    <div className="flex items-start gap-3">
      {link.icon ? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
          {link.icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{link.label}</div>
        {link.description ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {link.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function NavbarWithMenu({ sections }: { sections: NavMenuSection[] }) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pointer-events-none sticky top-0 z-50 flex justify-center px-4 pt-4">
      <div
        className={cn(
          // Frosted glass: heavy blur + saturation, translucent fill, and a
          // light inset ring for the glass edge highlight.
          "pointer-events-auto flex w-full items-center gap-2 rounded-full border px-3 py-2 ring-1 ring-inset ring-white/10 backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 ease-out dark:ring-white/5",
          scrolled
            ? "max-w-4xl border-white/20 bg-background/50 shadow-xl shadow-black/10 dark:border-white/10"
            : "max-w-6xl border-white/10 bg-background/25 shadow-lg shadow-black/5 dark:border-white/[0.06]",
        )}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2 pl-1 pr-1">
          <Image
            src="/images/clapperboard.png"
            alt=""
            aria-hidden
            width={20}
            height={20}
            className="size-5"
          />
          <span className="text-sm font-semibold">Keyloom</span>
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <NavigationMenu viewport={false} className="hidden md:flex">
            <NavigationMenuList>
              {sections.map((section) =>
                section.href ? (
                  <NavigationMenuItem key={section.id}>
                    <NavigationMenuLink
                      asChild
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      <Link href={section.href}>{section.label}</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ) : (
                  <NavigationMenuItem key={section.id}>
                    <NavigationMenuTrigger className="bg-transparent text-muted-foreground data-popup-open:text-foreground data-open:text-foreground">
                      {section.label}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul
                        className={section.gridLayout ?? "grid w-[22rem] gap-2"}
                      >
                        {section.links?.map((link) => (
                          <li
                            key={link.href}
                            className={cn(
                              "group/card",
                              link.rowSpan === 2 && "row-span-2",
                            )}
                          >
                            <NavigationMenuLink asChild>
                              <Link
                                href={link.href}
                                target={link.external ? "_blank" : undefined}
                                rel={
                                  link.external
                                    ? "noopener noreferrer"
                                    : undefined
                                }
                                className={cn(
                                  "h-full",
                                  link.backgroundImage && "block p-0",
                                )}
                              >
                                {link.backgroundImage ? (
                                  <FeaturedCard link={link} />
                                ) : (
                                  <PlainLink link={link} />
                                )}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ),
              )}
            </NavigationMenuList>
          </NavigationMenu>

          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            asChild
          >
            <Link
              href="https://github.com/theexperiencecompany/motion-studio"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              title="GitHub"
            >
              <GitHubMark className="size-4" />
            </Link>
          </Button>

          <AuthCta />
        </div>
      </div>
    </div>
  );
}
