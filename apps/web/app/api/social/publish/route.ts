import { withAuth } from "@workos-inc/authkit-nextjs";
import { NextResponse } from "next/server";
import {
  ensureProfile,
  profileFor,
  type SocialPlatform,
  uploadVideo,
} from "@/lib/upload-post";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KNOWN_PLATFORMS: SocialPlatform[] = [
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "linkedin",
  "x",
  "threads",
];

function parsePlatforms(raw: unknown): SocialPlatform[] {
  const list = Array.isArray(raw) ? raw : [];
  return list.filter((p): p is SocialPlatform =>
    KNOWN_PLATFORMS.includes(p as SocialPlatform),
  );
}

type PublishInput = {
  /** The MP4 itself (multipart) or a publicly fetchable URL (JSON). */
  video: Blob | string;
  filename?: string;
  platforms: SocialPlatform[];
  title?: string;
  /** ISO-8601 in the future to schedule; omit to post now. */
  scheduledDate?: string;
  timezone?: string;
};

async function readInput(req: Request): Promise<PublishInput | null> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    if (!form) return null;
    const video = form.get("video");
    if (!(video instanceof Blob) || video.size === 0) return null;
    let platformsRaw: unknown = [];
    try {
      platformsRaw = JSON.parse((form.get("platforms") as string) || "[]");
    } catch {
      // Malformed platforms field → treated as empty → 400 below.
    }
    const platforms = parsePlatforms(platformsRaw);
    if (!platforms.length) return null;
    return {
      video,
      filename: video instanceof File ? video.name : undefined,
      platforms,
      title: (form.get("title") as string) || undefined,
      scheduledDate: (form.get("scheduledDate") as string) || undefined,
      timezone: (form.get("timezone") as string) || undefined,
    };
  }

  const body = (await req.json().catch(() => ({}))) as {
    videoUrl?: string;
    platforms?: unknown;
    title?: string;
    scheduledDate?: string;
    timezone?: string;
  };
  const platforms = parsePlatforms(body.platforms);
  if (!body.videoUrl || !platforms.length) return null;
  return {
    video: body.videoUrl,
    platforms,
    title: body.title,
    scheduledDate: body.scheduledDate,
    timezone: body.timezone,
  };
}

/** Post (or schedule) a rendered meme to the user's connected social accounts. */
export async function POST(req: Request) {
  const { user } = await withAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const input = await readInput(req);
  if (!input) {
    return NextResponse.json(
      { error: "A video (file or URL) and at least one platform are required" },
      { status: 400 },
    );
  }

  try {
    const profile = profileFor(user.id);
    await ensureProfile(profile);
    const result = await uploadVideo({
      user: profile,
      platforms: input.platforms,
      video: input.video,
      filename: input.filename,
      title: input.title,
      scheduledDate: input.scheduledDate,
      timezone: input.timezone,
      async: true,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("social publish failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Publish failed" },
      { status: 502 },
    );
  }
}
