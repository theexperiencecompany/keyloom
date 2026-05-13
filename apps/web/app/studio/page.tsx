import type { Metadata } from "next";
import { Builder } from "@/features/studio/components/builder";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "Compose, preview, and export Remotion videos in the Motion Studio editor.",
};

export default function StudioPage() {
  return <Builder />;
}
