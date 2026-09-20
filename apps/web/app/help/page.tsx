import type { Metadata } from "next";
import Link from "next/link";
import { BrowseShell } from "@/components/browse-shell";

export const metadata: Metadata = {
  title: "Help",
  description: "A quick guide to making your first video in Keyloom.",
};

const guides = [
  {
    title: "How do I start a video?",
    text: "Open Explore and choose a scene. Try the controls beside its preview, then select Use in Studio. Your changes come with you into a new video.",
  },
  {
    title: "How do I add more scenes?",
    text: "In Studio, open the Library and pick another scene. Select a scene on the timeline to change its content and appearance. Drag scenes to change their order.",
  },
  {
    title: "How do I add captions?",
    text: "Open Studio, choose Captions in its sidebar, and upload your video to get started. You can review the words and change how the captions look before exporting.",
  },
  {
    title: "How do I download my video?",
    text: "Choose Export in Studio, review the export settings, and start rendering. When your video is ready, use Download to save it.",
  },
  {
    title: "Can I keep editing later?",
    text: "Use Save project in Studio’s File menu to save an editable project file. Keep that file so you can open it with Import project later. Exporting a video saves the finished video separately.",
  },
];

export default function HelpPage() {
  return (
    <BrowseShell>
      <div className="mx-auto max-w-3xl py-10">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          A little help getting started
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Start with a scene you like. Make a few changes. Build from there.
        </p>
        <Link
          href="/components"
          className="mt-6 inline-block text-sm font-medium underline underline-offset-4"
        >
          Explore scenes
        </Link>
        <div className="mt-10 divide-y divide-border">
          {guides.map((guide) => (
            <section key={guide.title} className="py-6">
              <h2 className="text-lg font-semibold">{guide.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {guide.text}
              </p>
            </section>
          ))}
        </div>
        <p className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
          Working with code? The{" "}
          <Link href="/docs" className="underline underline-offset-4">
            developer reference
          </Link>{" "}
          covers setup and component details.
        </p>
      </div>
    </BrowseShell>
  );
}
