import { withAuth } from "@workos-inc/authkit-nextjs";
import { NextResponse } from "next/server";
import {
  profileFor,
  type SocialPlatform,
  uploadVideo,
} from "@/lib/upload-post";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublishBody = {
  /** Publicly fetchable MP4 (e.g. an R2 URL). */
  videoUrl?: string;
  title?: string;
  platforms?: SocialPlatform[];
  /** ISO-8601 in the future to schedule; omit to post now. */
  scheduledDate?: string;
  timezone?: string;
};

/** Post (or schedule) a rendered meme to the user's connected social accounts. */
export async function POST(req: Request) {
  const { user } = await withAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as PublishBody;
  if (!body.videoUrl || !body.platforms?.length) {
    return NextResponse.json(
      { error: "videoUrl and at least one platform are required" },
      { status: 400 },
    );
  }

  try {
    const result = await uploadVideo({
      user: profileFor(user.id),
      platforms: body.platforms,
      videoUrl: body.videoUrl,
      title: body.title,
      scheduledDate: body.scheduledDate,
      timezone: body.timezone,
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
