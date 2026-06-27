import { MemeEditor } from "@/components/memes/meme-editor";

export default function MemesPage() {
  return (
    <div className="px-5 py-6 sm:px-8 lg:px-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Memes</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Pick a green-screen template, drop in a background, add your caption,
          and download the MP4.
        </p>
      </div>
      <MemeEditor />
    </div>
  );
}
