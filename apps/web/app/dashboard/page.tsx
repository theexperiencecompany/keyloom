import { ComponentGallery } from "@/components/gallery/component-gallery";

export default function DashboardPage() {
  return (
    <div className="px-5 py-6 sm:px-8 lg:px-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Components</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Open a component in the studio, or fork it to edit its code into your
          own version.
        </p>
      </div>
      <ComponentGallery showEdit stickyOffsetClass="top-12" />
    </div>
  );
}
