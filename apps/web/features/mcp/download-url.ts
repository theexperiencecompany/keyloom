/**
 * Public origin of the deployed app, used to build short download links the MCP
 * hands to clients. Prefers an explicit `APP_BASE_URL`, then Vercel's
 * production URL, falling back to localhost for dev.
 */
export function publicBaseUrl(): string {
  const explicit = process.env.APP_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

/**
 * Short, copy-safe link to a render's MP4. Resolves through `/api/r/[renderId]`,
 * which re-presigns the S3 object and 302-redirects to it. Used instead of the
 * raw ~500-char presigned URL, which wraps and gets mangled in many clients.
 */
export function buildDownloadUrl(renderId: string, bucketName: string): string {
  return `${publicBaseUrl()}/api/r/${encodeURIComponent(renderId)}?b=${encodeURIComponent(bucketName)}`;
}
