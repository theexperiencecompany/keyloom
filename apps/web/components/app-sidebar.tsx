"use client";

import {
  CreditCardIcon,
  Film01Icon,
  Folder01Icon,
  FolderLibraryIcon,
  Image02Icon,
  LibrariesIcon,
  Logout02Icon,
  Moon02Icon,
  PlugSocketIcon,
  Settings01Icon,
  Share08Icon,
  Sun03Icon,
  UnfoldMoreIcon,
  UserCircleIcon,
  VideoReplayIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
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
  SidebarSeparator,
  useSidebar,
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
      { label: "Components", href: "/components", icon: LibrariesIcon },
      {
        label: "My Projects",
        href: "/components/projects",
        icon: FolderLibraryIcon,
      },
      {
        label: "Posts",
        href: "/components/collections",
        icon: Folder01Icon,
      },
    ],
  },
  {
    label: "Create",
    items: [
      { label: "Studio", href: "/studio", icon: VideoReplayIcon },
      { label: "Memes", href: "/memes", icon: Image02Icon },
      { label: "Motions", href: "/motions", icon: Film01Icon },
    ],
  },
  {
    label: "Integration",
    items: [
      { label: "Integrations", href: "/integrations", icon: Share08Icon },
      { label: "MCP", href: "/mcp", icon: PlugSocketIcon },
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
        <SidebarHeader className="h-12 justify-center border-b border-border px-3 group-data-[collapsible=icon]:px-2">
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
        </SidebarHeader>

        <SidebarContent className="gap-1 pt-5">
          {SECTIONS.map((section, i) => (
            <React.Fragment key={section.label ?? `section-${i}`}>
              {i > 0 && (
                <SidebarSeparator className="mx-3 group-data-[collapsible=icon]:hidden" />
              )}
              <SidebarGroup className="py-1">
                {section.label && (
                  <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
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
                        <SidebarMenuBadge className="rounded-full bg-muted px-1.5 text-[10px] font-medium tracking-wide text-muted-foreground">
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
              <SidebarUser />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}

function UserAvatar({
  src,
  fallback,
}: {
  src?: string | null;
  fallback: string;
}) {
  if (src) {
    // External WorkOS avatar — plain <img> avoids next/image remote config.
    return (
      <img
        src={src}
        alt=""
        className="size-8 shrink-0 rounded-md object-cover"
      />
    );
  }
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
      {fallback}
    </div>
  );
}

function SidebarUser() {
  const { user, loading, signOut } = useAuth();
  const { isMobile } = useSidebar();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  if (loading) {
    return (
      <SidebarMenuButton size="lg" disabled className="gap-2">
        <div className="size-8 shrink-0 animate-pulse rounded-md bg-muted" />
        <div className="flex flex-col gap-1 group-data-[collapsible=icon]:hidden">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-2.5 w-28 animate-pulse rounded bg-muted" />
        </div>
      </SidebarMenuButton>
    );
  }

  if (!user) {
    return (
      <SidebarMenuButton size="lg" asChild tooltip="Sign in">
        <a href="/api/auth/signin">
          <HugeiconsIcon icon={UserCircleIcon} size={20} />
          <span className="font-medium">Sign in</span>
        </a>
      </SidebarMenuButton>
    );
  }

  const name = user.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user.email;
  const initial = (user.firstName || user.email || "?")
    .slice(0, 1)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          tooltip={name}
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <UserAvatar src={user.profilePictureUrl} fallback={initial} />
          <div className="flex min-w-0 flex-1 flex-col text-left leading-tight">
            <span className="truncate text-sm font-medium">{name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
          <HugeiconsIcon icon={UnfoldMoreIcon} size={16} className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
        side={isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center gap-2 font-normal">
          <UserAvatar src={user.profilePictureUrl} fallback={initial} />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium">{name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/account">
              <HugeiconsIcon icon={UserCircleIcon} size={16} />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/billing">
              <HugeiconsIcon icon={CreditCardIcon} size={16} />
              Billing
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/settings">
              <HugeiconsIcon icon={Settings01Icon} size={16} />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            setTheme(isDark ? "light" : "dark");
          }}
        >
          <HugeiconsIcon icon={isDark ? Sun03Icon : Moon02Icon} size={16} />
          {isDark ? "Light theme" : "Dark theme"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ returnTo: "/" })}>
          <HugeiconsIcon icon={Logout02Icon} size={16} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
