"use client";

import {
  Book01Icon,
  BrowserIcon,
  BubbleChatIcon,
  Clock01Icon,
  CommandLineIcon,
  ComputerVideoIcon,
  Cursor02Icon,
  Download01Icon,
  Moon02Icon,
  PaintBrush01Icon,
  TextFontIcon,
  TwitterIcon,
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

type NavItem = {
  title: string;
  href: string;
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
  badge?: string;
};

const TEXT_PREFIXES = ["Title", "Text"];
const CHAT_IDS = new Set([
  "MessagePopup",
  "MessageBubbles",
  "WhatsAppMessages",
  "SlackMessages",
  "DiscordMessages",
]);
const SOCIAL_IDS = new Set(["TweetCard", "TwitterFollow"]);
const FRAME_IDS = new Set(["BrowserWindow", "LaptopFrame", "PhoneFrame"]);

const textAnimations = compositions.filter((c) =>
  TEXT_PREFIXES.some((p) => c.id.startsWith(p)),
);
const chatComponents = compositions.filter((c) => CHAT_IDS.has(c.id));
const socialComponents = compositions.filter((c) => SOCIAL_IDS.has(c.id));
const frameComponents = compositions.filter((c) => FRAME_IDS.has(c.id));
const sceneComponents = compositions.filter(
  (c) =>
    !TEXT_PREFIXES.some((p) => c.id.startsWith(p)) &&
    !CHAT_IDS.has(c.id) &&
    !SOCIAL_IDS.has(c.id) &&
    !FRAME_IDS.has(c.id),
);

const gettingStarted: NavItem[] = [
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

const collapsibleGroups: Array<{
  value: string;
  section: string;
  items: NavItem[];
}> = [
  {
    value: "text-animations",
    section: "Text Animations",
    items: textAnimations.map((c) => ({
      title: c.title,
      href: `/docs/${c.id}`,
      icon: TextFontIcon,
    })),
  },
  {
    value: "chat",
    section: "Chat & Messaging",
    items: chatComponents.map((c) => ({
      title: c.title,
      href: `/docs/${c.id}`,
      icon: BubbleChatIcon,
    })),
  },
  {
    value: "social",
    section: "Social",
    items: socialComponents.map((c) => ({
      title: c.title,
      href: `/docs/${c.id}`,
      icon: TwitterIcon,
    })),
  },
  {
    value: "frames",
    section: "Frames & Mockups",
    items: frameComponents.map((c) => ({
      title: c.title,
      href: `/docs/${c.id}`,
      icon: BrowserIcon,
    })),
  },
  {
    value: "scenes",
    section: "Scenes & Effects",
    items: sceneComponents.map((c) => {
      const icon =
        c.id === "CursorWalkthrough"
          ? Cursor02Icon
          : c.id === "CaptionTrack"
            ? VideoAiIcon
            : ComputerVideoIcon;
      return { title: c.title, href: `/docs/${c.id}`, icon };
    }),
  },
];

export function AppSidebar() {
  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto py-8 pr-6 pl-8 lg:block">
      <AppSidebarNav />
    </aside>
  );
}

export function AppSidebarNav({
  onNavigate,
}: {
  onNavigate?: () => void;
} = {}) {
  const pathname = usePathname();

  const navLink = (item: NavItem) => {
    const active = pathname === item.href;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={onNavigate}
          className={`group relative flex h-8 items-center gap-2.5 rounded-md px-3 text-[13px] transition-all duration-150 ease-out ${
            active
              ? "bg-accent font-medium text-foreground"
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
          {item.badge && (
            <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
              {item.badge}
            </span>
          )}
        </Link>
      </li>
    );
  };

  const populatedGroups = collapsibleGroups.filter((g) => g.items.length > 0);
  const defaultOpen = populatedGroups.map((g) => g.value);

  return (
    <nav className="space-y-7">
      <div>
        <p className="mb-1 px-3 text-[11px] font-semibold text-muted-foreground/70">
          Getting Started
        </p>
        <ul className="space-y-px">{gettingStarted.map(navLink)}</ul>
      </div>

      <Accordion
        type="multiple"
        defaultValue={defaultOpen}
        className="space-y-5"
      >
        {populatedGroups.map((group) => (
          <AccordionItem
            key={group.value}
            value={group.value}
            className="border-none"
          >
            <AccordionTrigger className="mb-1 px-3 py-0 text-[11px] font-semibold text-muted-foreground/70 hover:no-underline [&>svg]:size-3">
              {group.section}
            </AccordionTrigger>
            <AccordionContent className="pt-0 pb-0">
              <ul className="space-y-px">{group.items.map(navLink)}</ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </nav>
  );
}
