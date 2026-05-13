"use client";

import {
  AnalyticsUpIcon,
  Book01Icon,
  BrowserIcon,
  CursorMagicSelection02Icon,
  CursorTextIcon,
  DashedLineCircleIcon,
  DownloadCircleIcon,
  MessageMultiple02Icon,
  PlayIcon,
  StarIcon,
  UserGroupIcon,
  UserLove02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { compositions } from "@workspace/compositions/registry";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

type IconRef = Parameters<typeof HugeiconsIcon>[0]["icon"];

type NavItem = {
  title: string;
  href: string;
  /** Optional — only Getting Started items render an icon now. */
  icon?: IconRef;
};

const TEXT_PREFIXES = ["Title", "Text"];
const CHAT_IDS = new Set([
  "MessageBubbles",
  "WhatsAppMessages",
  "TelegramMessages",
  "SlackMessages",
  "DiscordMessages",
  "InstagramMessages",
  "MessagePopup",
]);
const SOCIAL_IDS = new Set(["TweetCard", "TwitterFollow", "GitHubStarButton"]);
const FRAME_IDS = new Set(["BrowserWindow", "LaptopFrame", "PhoneFrame"]);
const CHART_IDS = new Set([
  "BarChart",
  "LineChart",
  "AreaChart",
  "PieChart",
  "RadarChart",
  "RadialChart",
]);
const GAIA_IDS = new Set(["GaiaScenario"]);

const textAnimations = compositions.filter((c) =>
  TEXT_PREFIXES.some((p) => c.id.startsWith(p)),
);
const chatComponents = compositions.filter((c) => CHAT_IDS.has(c.id));
const socialComponents = compositions.filter((c) => SOCIAL_IDS.has(c.id));
const frameComponents = compositions.filter((c) => FRAME_IDS.has(c.id));
const chartComponents = compositions.filter((c) => CHART_IDS.has(c.id));
const gaiaComponents = compositions.filter((c) => GAIA_IDS.has(c.id));
const sceneComponents = compositions.filter(
  (c) =>
    !TEXT_PREFIXES.some((p) => c.id.startsWith(p)) &&
    !CHAT_IDS.has(c.id) &&
    !SOCIAL_IDS.has(c.id) &&
    !FRAME_IDS.has(c.id) &&
    !CHART_IDS.has(c.id) &&
    !GAIA_IDS.has(c.id),
);

const gettingStarted: NavItem[] = [
  { title: "Introduction", href: "/docs", icon: Book01Icon },
  {
    title: "Installation",
    href: "/docs/installation",
    icon: DownloadCircleIcon,
  },
  { title: "Using the studio", href: "/docs/using-the-studio", icon: PlayIcon },
  { title: "Components", href: "/docs/components", icon: DashedLineCircleIcon },
  { title: "Contributors", href: "/docs/contributors", icon: UserLove02Icon },
];

type Group = {
  value: string;
  section: string;
  icon: IconRef;
  items: NavItem[];
};

const collapsibleGroups: Group[] = [
  {
    value: "scenes",
    section: "Scenes & Effects",
    icon: CursorMagicSelection02Icon,
    items: sceneComponents.map((c) => ({
      title: c.title,
      href: `/docs/${c.id}`,
    })),
  },
  {
    value: "charts",
    section: "Charts",
    icon: AnalyticsUpIcon,
    items: chartComponents.map((c) => ({
      title: c.title,
      href: `/docs/${c.id}`,
    })),
  },
  {
    value: "chat",
    section: "Chat & Messaging",
    icon: MessageMultiple02Icon,
    items: chatComponents.map((c) => ({
      title: c.title,
      href: `/docs/${c.id}`,
    })),
  },
  {
    value: "social",
    section: "Social",
    icon: UserGroupIcon,
    items: socialComponents.map((c) => ({
      title: c.title,
      href: `/docs/${c.id}`,
    })),
  },
  {
    value: "frames",
    section: "Frames & Mockups",
    icon: BrowserIcon,
    items: frameComponents.map((c) => ({
      title: c.title,
      href: `/docs/${c.id}`,
    })),
  },
  {
    value: "gaia",
    section: "GAIA",
    icon: StarIcon,
    items: gaiaComponents.map((c) => ({
      title: c.title,
      href: `/docs/${c.id}`,
    })),
  },
  {
    value: "text-animations",
    section: "Text Animations",
    icon: CursorTextIcon,
    items: textAnimations.map((c) => ({
      title: c.title,
      href: `/docs/${c.id}`,
    })),
  },
];

export function AppSidebar() {
  return (
    <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-52 shrink-0 overflow-y-auto border-r border-dashed border-border py-8 pr-4 pl-4 sm:w-56 sm:pl-6 sm:pr-5 lg:w-60 lg:pl-8 lg:pr-6">
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
        <Button
          asChild
          variant="ghost"
          className={`group h-auto w-full justify-start gap-2 rounded-lg px-2.5 py-1.5 text-left ${
            active ? "bg-accent" : ""
          }`}
        >
          <Link href={item.href} onClick={onNavigate}>
            {item.icon && (
              <HugeiconsIcon
                icon={item.icon}
                size={14}
                className={`shrink-0 ${
                  active
                    ? "text-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
            )}
            <span
              className={`min-w-0 flex-1 truncate text-[13px] ${
                active
                  ? "font-medium text-foreground"
                  : "text-foreground/80 group-hover:text-foreground"
              }`}
            >
              {item.title}
            </span>
          </Link>
        </Button>
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
              <span className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={group.icon}
                  size={13}
                  className="shrink-0 text-muted-foreground/70"
                />
                {group.section}
              </span>
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
