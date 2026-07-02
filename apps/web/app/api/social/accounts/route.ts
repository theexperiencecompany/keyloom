import { withAuth } from "@workos-inc/authkit-nextjs";
import { NextResponse } from "next/server";
import { getProfile, profileFor } from "@/lib/upload-post";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Which social platforms the current user has connected via upload-post. */
export async function GET() {
  const { user } = await withAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const profile = await getProfile(profileFor(user.id));
    const connected = Object.fromEntries(
      Object.entries(profile.social_accounts ?? {}).map(([k, v]) => [k, !!v]),
    );
    return NextResponse.json({ connected });
  } catch {
    // No profile yet (or provider hiccup) → nothing connected.
    return NextResponse.json({ connected: {} });
  }
}
