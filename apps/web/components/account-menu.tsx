"use client";

import { Logout02Icon, UserCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import Link from "next/link";

/**
 * Navbar account control. Reflects the live auth state from AuthKit:
 *  - loading  → neutral disabled button (no layout shift)
 *  - signed out → "Sign in" → /account (middleware redirects to WorkOS)
 *  - signed in → dropdown with email, account link, and sign out.
 */
export function AccountMenu() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5" disabled>
        <HugeiconsIcon icon={UserCircleIcon} className="size-4" />
        <span className="hidden text-xs sm:inline">Account</span>
      </Button>
    );
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5" asChild>
        <a href="/api/auth/signin" title="Sign in">
          <HugeiconsIcon icon={UserCircleIcon} className="size-4" />
          <span className="hidden text-xs sm:inline">Sign in</span>
        </a>
      </Button>
    );
  }

  const label = user.firstName || user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          {user.profilePictureUrl ? (
            // External WorkOS avatar — plain <img> avoids next/image remote-pattern config.
            <img
              src={user.profilePictureUrl}
              alt=""
              className="size-5 rounded-full object-cover"
            />
          ) : (
            <HugeiconsIcon icon={UserCircleIcon} className="size-4" />
          )}
          <span className="hidden max-w-[120px] truncate text-xs sm:inline">
            {label}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
          {user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">Account &amp; API keys</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut({ returnTo: "/" })}>
          <HugeiconsIcon icon={Logout02Icon} className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
