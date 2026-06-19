import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

// AuthKit session handling for the dashboard. Scoped to /account so the rest of
// the app (and the API-key-gated /api/mcp endpoint) is untouched.
//
// middlewareAuth.enabled makes the MIDDLEWARE enforce sign-in and perform the
// redirect to WorkOS — the only place the PKCE state cookie can be set. Without
// it, `withAuth({ ensureSignedIn: true })` in the page tries to set that cookie
// during render, which Next forbids ("Cookies can only be modified in a Server
// Action or Route Handler").
export default authkitMiddleware({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: [],
  },
});

export const config = {
  // Every matched path requires auth (unauthenticatedPaths is empty), so keep
  // this scoped to /account only.
  matcher: ["/account/:path*"],
};
