import { AppSidebar } from "@/components/app-sidebar";
import { DocsHeader } from "@/components/docs-header";
import { SiteFooter } from "@/components/site-footer";

export default function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto flex max-w-[1600px] min-h-screen flex-col border-x border-dashed border-white/10">
      <DocsHeader />
      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <SiteFooter />
    </div>
  );
}
