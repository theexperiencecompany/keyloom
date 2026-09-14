import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

/**
 * Shared application shell: the collapsible sidebar plus the inset content
 * area with a sticky header. Used by every app surface (components, studio
 * tools, …) so they share one layout instead of duplicating it.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 bg-background px-4">
          <SidebarTrigger />
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
