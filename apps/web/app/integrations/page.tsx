import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { IntegrationsClient } from "@/components/integrations/integrations-client";
import { getProfile, profileFor } from "@/lib/upload-post";

// Connection state is fetched live from upload-post per request.
export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const { user } = await withAuth();
  if (!user) redirect("/api/auth/signin");

  // A platform is connected when upload-post has a non-empty handle for it.
  let connected: Record<string, boolean> = {};
  try {
    const profile = await getProfile(profileFor(user.id));
    connected = Object.fromEntries(
      Object.entries(profile.social_accounts ?? {}).map(([k, v]) => [k, !!v]),
    );
  } catch {
    // No profile yet (or key missing) → treat everything as not connected.
  }

  return <IntegrationsClient connected={connected} />;
}
