/**
 * Thin server-side client for upload-post.com — our social posting provider.
 *
 * upload-post hosts the per-user OAuth connection (so we never touch Meta App
 * Review / TikTok audit) and handles scheduling. We map each Keyloom user to an
 * upload-post "profile" keyed by their user id.
 *
 * Auth: every request sends `Authorization: Apikey <UPLOAD_POST_API_KEY>`. The
 * key is server-only — never expose it to the client.
 */

const BASE = "https://api.upload-post.com/api";

export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "linkedin"
  | "x"
  | "threads";

function apiKey(): string {
  const key = process.env.UPLOAD_POST_API_KEY;
  if (!key) throw new Error("UPLOAD_POST_API_KEY is not set");
  return key;
}

async function call<T>(
  path: string,
  init: RequestInit & { body?: BodyInit } = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Apikey ${apiKey()}`,
      ...init.headers,
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & {
    success?: boolean;
    message?: string;
  };
  if (!res.ok || data.success === false) {
    throw new Error(
      data.message || `upload-post ${path} failed (HTTP ${res.status})`,
    );
  }
  return data as T;
}

/** Stable upload-post profile name for a Keyloom user. */
export function profileFor(userId: string): string {
  return `kl_${userId}`;
}

/** Create the profile if it doesn't exist yet (idempotent). */
export async function ensureProfile(username: string): Promise<void> {
  try {
    await call("/uploadposts/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
  } catch (err) {
    // Already-exists is fine; rethrow anything else.
    if (!/exist/i.test(err instanceof Error ? err.message : "")) throw err;
  }
}

/**
 * Generate the hosted URL where the user links their social accounts. Valid for
 * 48h. `redirectUrl` is where upload-post sends them back after connecting.
 */
export async function generateConnectUrl(opts: {
  username: string;
  platforms?: SocialPlatform[];
  redirectUrl?: string;
}): Promise<string> {
  const { access_url } = await call<{ access_url: string }>(
    "/uploadposts/users/generate-jwt",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: opts.username,
        platforms: opts.platforms,
        redirect_url: opts.redirectUrl,
      }),
    },
  );
  return access_url;
}

/** Which platforms a profile has connected (empty string = not connected). */
export async function getProfile(username: string): Promise<{
  username: string;
  social_accounts: Record<string, string>;
}> {
  return call(`/uploadposts/users/${encodeURIComponent(username)}`);
}

/**
 * Post (or schedule) a video to the given platforms for a profile. `video` is
 * either a publicly fetchable URL (e.g. an R2 URL) or the MP4 itself as a Blob
 * — upload-post accepts both on the same endpoint. Pass `scheduledDate`
 * (ISO-8601, in the future) + `timezone` to schedule instead of posting
 * immediately.
 */
export async function uploadVideo(opts: {
  user: string;
  platforms: SocialPlatform[];
  video: string | Blob;
  filename?: string;
  title?: string;
  scheduledDate?: string;
  timezone?: string;
  async?: boolean;
}): Promise<
  { request_id?: string; job_id?: string } & Record<string, unknown>
> {
  const form = new FormData();
  form.append("user", opts.user);
  for (const p of opts.platforms) form.append("platform[]", p);
  if (typeof opts.video === "string") {
    form.append("video", opts.video);
  } else {
    form.append("video", opts.video, opts.filename ?? "video.mp4");
  }
  if (opts.title) form.append("title", opts.title);
  if (opts.scheduledDate) form.append("scheduled_date", opts.scheduledDate);
  if (opts.timezone) form.append("timezone", opts.timezone);
  if (opts.async) form.append("async_upload", "true");
  return call("/upload", { method: "POST", body: form });
}

/** Poll an async (`request_id`) or scheduled (`job_id`) upload. */
export async function getUploadStatus(params: {
  requestId?: string;
  jobId?: string;
}): Promise<Record<string, unknown>> {
  const q = new URLSearchParams();
  if (params.requestId) q.set("request_id", params.requestId);
  if (params.jobId) q.set("job_id", params.jobId);
  return call(`/uploadposts/status?${q.toString()}`);
}
