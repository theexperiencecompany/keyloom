import { GalleryMount } from "@/components/gallery/gallery-mount";

export function GallerySection() {
  return (
    <section
      id="library"
      className="scroll-mt-16 border-b border-dashed border-border px-5 py-20 sm:px-8 sm:py-24 lg:px-10"
    >
      <div className="mb-10 max-w-2xl">
        <p className="text-[13px] font-medium uppercase tracking-wider text-primary">
          The library
        </p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          A scene for every moment.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Animated titles, data charts, device mockups, captions, and
          pixel-accurate social cards. Every scene previews live and drops
          straight onto your timeline.
        </p>
      </div>

      <GalleryMount />
    </section>
  );
}
