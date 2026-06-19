import { handleAuth } from "@workos-inc/authkit-nextjs";

// WorkOS redirects here after sign-in (NEXT_PUBLIC_WORKOS_REDIRECT_URI).
// Exchanges the code for a session, then lands the user on /account.
export const GET = handleAuth({ returnPathname: "/account" });
