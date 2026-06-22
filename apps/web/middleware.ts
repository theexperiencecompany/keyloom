import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

// Session-only AuthKit middleware. It must run on EVERY page route, because the
// app-wide <AuthKitProvider> (and any server `withAuth()` call) requires the
// route to be covered by this middleware — otherwise WorkOS throws "You are
// calling 'withAuth' on a route that isn't covered by the AuthKit middleware".
//
// We deliberately do NOT enable `middlewareAuth` (no global forced login).
// /account guards itself by redirecting signed-out users to /api/auth/signin
// (a route handler — the only place the PKCE cookie can legally be set).
export default authkitMiddleware();

export const config = {
  // All page routes EXCEPT API routes, Next internals, and static files
  // (anything with a dot). Keeps the API-key-gated /api/mcp + webhooks
  // untouched while covering every page the provider mounts on.
  //
  // `/api/components` is the exception: it uses session `withAuth()` (not an
  // API key), so it MUST be covered by the middleware or WorkOS throws.
  matcher: [
    "/((?!api/|_next/|.*\\..*).*)",
    "/api/components",
    "/api/components/:path*",
  ],
};
