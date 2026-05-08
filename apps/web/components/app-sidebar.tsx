"use client";

import {
  Book01Icon,
  Clock01Icon,
  CommandLineIcon,
  Download01Icon,
  Moon02Icon,
  PaintBrush01Icon,
  TextFontIcon,
  VideoAiIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { compositions } from "@workspace/compositions/registry";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import Link from "next/link";
import { usePathname } from "next/navigation";

const textAnimations = compositions.filter(
  (c) => c.id.startsWith("Title") || c.id.startsWith("Text"),
);
const templates = compositions.filter(
  (c) => !c.id.startsWith("Title") && !c.id.startsWith("Text"),
);

const gettingStarted = [
  { title: "Introduction", href: "/docs", icon: Book01Icon },
  { title: "Installation", href: "/docs/installation", icon: Download01Icon },
  { title: "Theming", href: "/docs/theming", icon: PaintBrush01Icon },
  { title: "Dark Mode", href: "/docs/dark-mode", icon: Moon02Icon },
  { title: "CLI", href: "/docs/cli", icon: CommandLineIcon },
  {
    title: "Changelog",
    href: "/docs/changelog",
    icon: Clock01Icon,
    badge: "v1.0",
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  const navLink = (item: {
    title: string;
    href: string;
    icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
    badge?: string;
  }) => {
    const active = pathname === item.href;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className={`group relative flex h-8 items-center gap-2.5 rounded-md px-3 text-[13px] transition-all duration-150 ease-out ${
            active
              ? "bg-accent text-foreground font-medium"
              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
          }`}
        >
          <HugeiconsIcon
            icon={item.icon}
            size={14}
            className={`shrink-0 transition-colors duration-150 ${
              active
                ? "text-foreground"
                : "text-muted-foreground group-hover:text-foreground"
            }`}
          />
          <span className="flex-1 truncate">{item.title}</span>
          {"badge" in item && item.badge && (
            <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
              {item.badge}
            </span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto py-8 pl-8 pr-6">
      <nav className="space-y-7">
        <div>
          <p className="mb-2.5 px-3 text-[11px] font-semibold text-muted-foreground/70">
            Getting Started
          </p>
          <ul className="space-y-px">{gettingStarted.map(navLink)}</ul>
        </div>

        <Accordion
          type="multiple"
          defaultValue={["text-animations", "templates"]}
          className="space-y-5"
        >
          <AccordionItem value="text-animations" className="border-none">
            <AccordionTrigger className="mb-2.5 px-3 py-0 text-[11px] font-semibold text-muted-foreground/70 hover:no-underline [&>svg]:size-3">
              Text Animations
            </AccordionTrigger>
            <AccordionContent className="pb-0 pt-2">
              <ul className="space-y-px">
                {textAnimations.map((c) =>
                  navLink({
                    title: c.title,
                    href: `/docs/${c.id}`,
                    icon: TextFontIcon,
                  }),
                )}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="templates" className="border-none">
            <AccordionTrigger className="mb-2.5 px-3 py-0 text-[11px] font-semibold text-muted-foreground/70 hover:no-underline [&>svg]:size-3">
              Templates
            </AccordionTrigger>
            <AccordionContent className="pb-0 pt-2">
              <ul className="space-y-px">
                {templates.map((c) =>
                  navLink({
                    title: c.title,
                    href: `/docs/${c.id}`,
                    icon: VideoAiIcon,
                  }),
                )}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </nav>
    </aside>
  );
}
