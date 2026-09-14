/**
 * Local single-user identity.
 *
 * The app does not authenticate: there is exactly one implicit local user and
 * every server call resolves to it. Its `id` is the stable owner key for forked
 * components (`user_components.user_id`).
 */

export type AuthUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
};

export const LOCAL_USER: AuthUser = {
  id: "local-user",
  email: "local@localhost",
  firstName: "Local",
  lastName: "User",
  profilePictureUrl: null,
};

/** Resolve the current user. Always the local user — never null. */
export async function withAuth(): Promise<{ user: AuthUser }> {
  return { user: LOCAL_USER };
}
