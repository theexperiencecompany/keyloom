"use client";

import {
  ClosedCaptionIcon,
  FolderLibraryIcon,
  Home01Icon,
  Image02Icon,
  LayoutTwoRowIcon,
  LibrariesIcon,
  Moon02Icon,
  Sun03Icon,
  VideoReplayIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import * as React from "react";

type NavItem = {
  label: string;
  href: string;
  icon: typeof LibrariesIcon;
  badge?: string;
  external?: boolean;
};

type NavSection = {
  label?: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    items: [
      { label: "Home", href: "/home", icon: Home01Icon },
      { label: "Components", href: "/components", icon: LibrariesIcon },
      {
        label: "My Projects",
        href: "/components/projects",
        icon: FolderLibraryIcon,
      },
    ],
  },
  {
    label: "Create",
    items: [
      { label: "Studio", href: "/studio", icon: VideoReplayIcon },
      { label: "Memes", href: "/memes", icon: Image02Icon },
      { label: "Split Screen", href: "/split", icon: LayoutTwoRowIcon },
      { label: "Captions", href: "/captions", icon: ClosedCaptionIcon },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  // Exact match for "/" and "/components" so they don't both light up on
  // nested routes like /components/projects; prefix match for the rest.
  const isActive = (href: string) =>
    href === "/" || href === "/components"
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-12 justify-center px-3 group-data-[collapsible=icon]:px-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <Image
              src="/images/clapperboard.png"
              alt=""
              aria-hidden
              width={24}
              height={24}
              className="size-6 shrink-0"
            />
            <span className="font-heading text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
              Keyloom
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="gap-1 pt-5">
          {SECTIONS.map((section, i) => (
            <React.Fragment key={section.label ?? `section-${i}`}>
              <SidebarGroup className="py-1">
                {section.label && (
                  <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.16em]">
                    {section.label}
                  </SidebarGroupLabel>
                )}
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={!item.external && isActive(item.href)}
                        tooltip={item.label}
                      >
                        {item.external ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <HugeiconsIcon icon={item.icon} size={18} />
                            <span>{item.label}</span>
                          </a>
                        ) : (
                          <Link href={item.href}>
                            <HugeiconsIcon icon={item.icon} size={18} />
                            <span>{item.label}</span>
                          </Link>
                        )}
                      </SidebarMenuButton>
                      {item.badge && (
                        <SidebarMenuBadge className="rounded-full bg-blue-500/10 px-1.5 text-[10px] font-medium tracking-wide text-blue-500 peer-hover/menu-button:text-blue-500 peer-data-active/menu-button:text-blue-500">
                          {item.badge}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            </React.Fragment>
          ))}
        </SidebarContent>

        <SidebarFooter className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarThemeToggle />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}

function SidebarThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;
  const label = isDark ? "Light theme" : "Dark theme";

  return (
    <SidebarMenuButton
      tooltip={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <HugeiconsIcon icon={isDark ? Sun03Icon : Moon02Icon} size={18} />
      <span>{label}</span>
    </SidebarMenuButton>
  );
}
