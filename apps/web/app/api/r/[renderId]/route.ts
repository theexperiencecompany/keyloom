import { NextResponse } from "next/server";
import { getRenderStatus } from "@/features/mcp/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Short, stable redirect to a rendered MP4.
 *
 * The MCP tools hand clients a link to THIS endpoint
 * (`/api/r/<renderId>?b=<bucket>`) instead of the raw ~500-char presigned S3
 * URL. Those presigned URLs wrap across lines in terminal-style clients and get
 * mangled on copy (stray `%20%20` / characters break the SigV4 signature), so
 * users end up with dead links. This URL is short enough to never wrap, carries
 * no signature to corrupt, and re-presigns on every hit — so it also sidesteps
 * the 6-hour expiry of the underlying S3 link.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ renderId: string }> },
) {
  const { renderId } = await params;
  const bucketName = new URL(request.url).searchParams.get("b");

  if (!renderId || !bucketName) {
    return NextResponse.json(
      { error: "Missing renderId or bucket (?b=)." },
      { status: 400 },
    );
  }

  try {
    const status = await getRenderStatus(renderId, bucketName);
    if (!status.done || !status.url) {
      // Still rendering — tell the caller to retry rather than 404.
      return NextResponse.json(
        { done: false, progress: status.progress },
        { status: 202 },
      );
    }
    // 302 to a freshly-presigned S3 URL. Browsers and `fetch` follow it
    // transparently, so the short link behaves exactly like the file.
    return NextResponse.redirect(status.url, 302);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Render lookup failed." },
      { status: 500 },
    );
  }
}
