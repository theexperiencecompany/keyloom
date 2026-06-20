"use client";

import dynamic from "next/dynamic";

// The gallery imports the entire Remotion composition library (componentsById +
// @remotion/player). Loading it with ssr:false keeps that heavy graph out of the
// `/` route's server render path, so the page shell appears immediately and the
// gallery hydrates in behind a skeleton instead of blocking the whole route.
const GalleryBrowser = dynamic(
  () => import("./gallery-browser").then((m) => m.GalleryBrowser),
  { ssr: false, loading: () => <GallerySkeleton /> },
);

export function GalleryMount() {
  return <GalleryBrowser />;
}

function GallerySkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 py-2.5">
        <div className="h-7 w-7 shrink-0 rounded-md bg-muted/40" />
        <div className="h-5 w-px shrink-0 bg-border" />
        <div className="flex gap-1.5">
          {["t0", "t1", "t2", "t3", "t4", "t5"].map((k) => (
            <div key={k} className="h-7 w-20 rounded-full bg-muted/40" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {["c0", "c1", "c2", "c3", "c4", "c5", "c6", "c7"].map((k) => (
          <div
            key={k}
            className="overflow-hidden rounded-xl border border-border bg-muted/20"
          >
            <div className="aspect-video w-full animate-pulse bg-muted/40" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-1/2 rounded bg-muted/40" />
              <div className="h-2.5 w-3/4 rounded bg-muted/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
