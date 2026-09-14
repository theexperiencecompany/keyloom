import type { AwsRegion } from "@remotion/lambda/client";

/**
 * Helpers shared by the Lambda render API routes
 * (`/api/render/lambda`, `/api/render/lambda/progress`, `/api/render/lambda/cancel`).
 *
 * Server-side only: these read `process.env` and are imported exclusively from
 * route handlers.
 */

export function env(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function intEnv(name: string, fallback: number): number {
  const raw = env(name);
  if (!raw) return fallback;

  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}

export function lambdaConfig() {
  const region = env("REMOTION_AWS_REGION");
  const serveUrl = env("REMOTION_LAMBDA_SERVE_URL");

  if (!region || !serveUrl) {
    throw new Error(
      "Lambda rendering is not configured. Set REMOTION_AWS_REGION and REMOTION_LAMBDA_SERVE_URL in apps/web/.env.local.",
    );
  }

  const functionName = env("REMOTION_LAMBDA_FUNCTION_NAME");
  if (!functionName) {
    throw new Error("REMOTION_LAMBDA_FUNCTION_NAME is not set");
  }

  return {
    region: region as AwsRegion,
    serveUrl,
    functionName,
    // `framesPerLambda` and `concurrency` are mutually exclusive in Remotion —
    // they control the same chunking knob, so passing both throws. We use
    // `framesPerLambda` (frames per worker); `concurrencyPerLambda` (browser
    // tabs inside one worker) is a separate setting and coexists fine.
    concurrencyPerLambda: intEnv("REMOTION_LAMBDA_CONCURRENCY_PER_LAMBDA", 1),
    framesPerLambda: intEnv("REMOTION_LAMBDA_FRAMES_PER_LAMBDA", 20),
    maxRetries: intEnv("REMOTION_LAMBDA_MAX_RETRIES", 3),
  };
}

/**
 * Returns the JSON path of the first `blob:` URL found anywhere in `value`, or
 * null. Lambda cannot fetch browser-only blob URLs, so callers reject them
 * up front with a pointer to the offending field.
 */
export function findBlobUrl(value: unknown, path = "project"): string | null {
  if (typeof value === "string") {
    return value.startsWith("blob:") ? path : null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const found = findBlobUrl(value[i], `${path}[${i}]`);
      if (found) return found;
    }
    return null;
  }

  for (const [key, nested] of Object.entries(value)) {
    const found = findBlobUrl(nested, `${path}.${key}`);
    if (found) return found;
  }

  return null;
}

export function filenameForNow(): string {
  return `keyloom-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19)}.mp4`;
}

export function filenameFromKey(key: string | null, fallback: string): string {
  if (!key) return fallback;
  return key.split("/").pop() || fallback;
}

export function firstErrorMessage(errors: unknown): string {
  if (!Array.isArray(errors) || errors.length === 0) {
    return "Lambda render failed.";
  }

  const first = errors[0] as {
    message?: string;
    name?: string;
    stack?: string;
  };
  return first.message ?? first.stack ?? first.name ?? "Lambda render failed.";
}

/**
 * Absolute origin for the image proxy. Prefer an explicit deploy URL (so the
 * proxy points at the public app even when called internally); otherwise derive
 * it from the incoming request.
 */
export function proxyBaseUrl(request: Request): string {
  const configured = env("NEXT_PUBLIC_APP_URL") ?? env("APP_URL");
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}
