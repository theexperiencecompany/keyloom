"use client";

import { Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "Components", href: "/" },
  { label: "Studio", href: "/studio" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  // Radix Dialog (used by Sheet) calls `useId` to wire aria-controls between
  // the trigger and content. Each new Radix tree on the page increments the
  // global id counter, so server-rendered tree and client-rendered tree can
  // emit different `radix-_R_*_` ids → hydration mismatch on aria-controls.
  // Defer mounting the real Sheet until after hydration. A static button
  // stands in during SSR so the header layout doesn't jump.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Open navigation"
        className="lg:hidden"
        disabled
      >
        <HugeiconsIcon icon={Menu01Icon} className="size-5" />
      </Button>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Open navigation"
          className="lg:hidden"
        >
          <HugeiconsIcon icon={Menu01Icon} className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 overflow-y-auto bg-background p-0"
      >
        <div className="border-b border-dashed border-border px-6 py-4">
          <SheetTitle className="text-sm">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Browse the app
          </SheetDescription>
        </div>
        <nav className="flex flex-col gap-1 px-4 py-6">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
