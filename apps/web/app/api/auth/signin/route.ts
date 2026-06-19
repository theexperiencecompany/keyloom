import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Starts WorkOS sign-in. Lives in a route handler — not a page — because
 * generating the sign-in URL sets the PKCE state cookie, and cookies can only
 * be written from a Route Handler or Server Action (never during page render).
 * After login, WorkOS returns to /callback, which lands the user on /account.
 */
export async function GET() {
  redirect(await getSignInUrl());
}
