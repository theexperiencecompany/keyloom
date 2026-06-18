import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

// AuthKit session handling for the dashboard. Scoped to /account so the rest of
// the app (and the API-key-gated /api/mcp endpoint) is untouched.
export default authkitMiddleware();

export const config = {
  matcher: ["/account/:path*"],
};
