"use client";

import {
  AiMagicIcon,
  Github01Icon,
  LibrariesIcon,
  Search01Icon,
  UserGroupIcon,
  VideoReplayIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { AccountMenu } from "@/components/account-menu";
import { DocsSearch } from "@/components/docs-search";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = {
  label: string;
  href: string;
  icon: typeof LibrariesIcon;
};

const NAV: NavItem[] = [
  { label: "Components", href: "/dashboard", icon: LibrariesIcon },
  { label: "My Projects", href: "/dashboard/projects", icon: AiMagicIcon },
  { label: "Studio", href: "/studio", icon: VideoReplayIcon },
  { label: "Creators", href: "/creators", icon: UserGroupIcon },
];

export function AppSidebar() {
  const pathname = usePathname();
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

  // Exact match for "/" and "/dashboard" so they don't both light up on
  // nested routes like /dashboard/projects; prefix match for the rest.
  const isActive = (href: string) =>
    href === "/" || href === "/dashboard"
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="gap-3 p-3">
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
            <span className="text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
              Keyloom
            </span>
          </Link>

          <Button
            asChild
            className="w-full justify-center gap-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"
          >
            <Link href="/studio">
              <HugeiconsIcon icon={AiMagicIcon} size={18} />
              <span className="group-data-[collapsible=icon]:hidden">
                Create Animation
              </span>
            </Link>
          </Button>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground group-data-[collapsible=icon]:hidden"
          >
            <HugeiconsIcon icon={Search01Icon} size={15} />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="font-mono text-[11px] text-muted-foreground/60">
              ⌘K
            </kbd>
          </button>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <HugeiconsIcon icon={item.icon} size={18} />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="gap-2 p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="GitHub">
                <a
                  href="https://github.com/theexperiencecompany/keyloom"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <HugeiconsIcon icon={Github01Icon} size={18} />
                  <span>GitHub</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:flex-col">
            <AccountMenu />
            <ThemeToggle />
          </div>
        </SidebarFooter>
      </Sidebar>

      <DocsSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </TooltipProvider>
  );
}
