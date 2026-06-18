import type { AwsRegion } from "@remotion/lambda/client";

export type LambdaConfig = {
  region: AwsRegion;
  serveUrl: string;
  functionName: string;
};

/**
 * Reads the Lambda render target from the environment — the SAME variables the
 * web app's render routes use (`apps/web/.env.local`). AWS credentials are read
 * automatically by `@remotion/lambda` from `REMOTION_AWS_ACCESS_KEY_ID` /
 * `REMOTION_AWS_SECRET_ACCESS_KEY` (or the standard `AWS_*` vars), so they're
 * not handled here.
 *
 * Throws a clear, actionable error when anything required is missing — the MCP
 * client surfaces it to the user.
 */
export function getLambdaConfig(): LambdaConfig {
  const region = process.env.REMOTION_AWS_REGION?.trim();
  const serveUrl = process.env.REMOTION_LAMBDA_SERVE_URL?.trim();
  const functionName = process.env.REMOTION_LAMBDA_FUNCTION_NAME?.trim();

  const missing = [
    !region && "REMOTION_AWS_REGION",
    !serveUrl && "REMOTION_LAMBDA_SERVE_URL",
    !functionName && "REMOTION_LAMBDA_FUNCTION_NAME",
  ].filter(Boolean);

  if (missing.length > 0 || !region || !serveUrl || !functionName) {
    throw new Error(
      `MCP rendering is not configured — missing ${missing.join(", ")}. Set them in apps/web/.env.local (same vars the studio Lambda export uses).`,
    );
  }

  return { region: region as AwsRegion, serveUrl, functionName };
}
