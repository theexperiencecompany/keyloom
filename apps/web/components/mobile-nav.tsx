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
import { useEffect, useState } from "react";
import { AppSidebarNav } from "@/components/app-sidebar";

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
            Browse documentation sections
          </SheetDescription>
        </div>
        <div className="px-4 py-6">
          <AppSidebarNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
