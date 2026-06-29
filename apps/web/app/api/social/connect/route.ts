import { withAuth } from "@workos-inc/authkit-nextjs";
import { NextResponse } from "next/server";
import {
  ensureProfile,
  generateConnectUrl,
  profileFor,
} from "@/lib/upload-post";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns a hosted upload-post URL where the signed-in user links their
 * Instagram/TikTok accounts. The client redirects the user to it.
 */
export async function POST() {
  const { user } = await withAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.keyloom.app";
  const username = profileFor(user.id);

  try {
    await ensureProfile(username);
    const url = await generateConnectUrl({
      username,
      platforms: ["instagram", "tiktok"],
      redirectUrl: `${appUrl}/posts?connected=1`,
    });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("social connect failed:", err);
    return NextResponse.json(
      { error: "Could not start social connection" },
      { status: 502 },
    );
  }
}
