import { Github01Icon, NewTwitterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import Grainient from "@/components/Grainient";

type FooterLink = { label: string; href: string; external?: boolean };

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Components", href: "/components" },
      { label: "Studio", href: "/studio" },
      { label: "Shorts", href: "/shorts" },
      { label: "MCP", href: "/mcp" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Playground", href: "/playground" },
      { label: "Build", href: "/build" },
      { label: "Account", href: "/account" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "GAIA", href: "https://heygaia.io", external: true },
      {
        label: "GitHub",
        href: "https://github.com/theexperiencecompany/motion-studio",
        external: true,
      },
      { label: "X (Twitter)", href: "https://x.com/madebyexp", external: true },
    ],
  },
];

const socials = [
  {
    label: "GitHub",
    href: "https://github.com/theexperiencecompany/motion-studio",
    icon: <HugeiconsIcon icon={Github01Icon} size={18} />,
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/madebyexp",
    icon: <HugeiconsIcon icon={NewTwitterIcon} size={18} />,
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="px-4 pb-6 pt-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl">
        {/* Animated grainy gradient backdrop. */}
        <div className="absolute inset-0">
          <Grainient
            className="h-full w-full"
            color1="#7C5CF0"
            color2="#4318C9"
            color3="#5B21B6"
            grainAmount={0.08}
            zoom={1.1}
          />
        </div>
        {/* Darken the gradient so white text stays legible over its light areas. */}
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        <div className="relative z-10 p-8 text-white sm:p-12">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_2fr]">
            {/* Brand + blurb + socials */}
            <div className="max-w-sm">
              <Link href="/" className="flex items-center gap-2.5">
                <Image
                  src="/images/clapperboard.png"
                  alt=""
                  aria-hidden
                  width={28}
                  height={28}
                  className="size-7"
                />
                <span className="text-xl font-semibold">Keyloom</span>
              </Link>
              <p className="mt-5 text-pretty text-sm leading-relaxed text-white/85">
                Keyloom is a library of cinematic scenes for Remotion — browse,
                preview, and drop them straight into a video. Built for creators
                who want polished motion without starting from scratch.
              </p>
              <div className="mt-8 flex items-center gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="grid size-10 place-items-center rounded-full bg-white text-black transition-transform hover:scale-105"
                  >
                    {s.icon}
                  </a>
                ))}
                <a
                  href="https://heygaia.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GAIA"
                  title="GAIA"
                  className="grid size-10 place-items-center rounded-full bg-white transition-transform hover:scale-105"
                >
                  <Image
                    src="/gaia_logo.png"
                    alt=""
                    aria-hidden
                    width={18}
                    height={18}
                    className="size-[18px] rounded-sm"
                  />
                </a>
              </div>
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:justify-items-end">
              {columns.map((col) => (
                <div key={col.title}>
                  <h3 className="text-sm font-semibold text-white">
                    {col.title}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        {link.external ? (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-white/85 transition-colors hover:text-white"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            href={link.href}
                            className="text-sm text-white/85 transition-colors hover:text-white"
                          >
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-6 text-xs text-white/75 sm:flex-row">
            <p className="tabular-nums">
              © {year} The Experience Company · MIT
            </p>
            <p>Made with Remotion</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
