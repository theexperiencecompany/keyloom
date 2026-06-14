import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Strips anything that could break out of the Content-Disposition header or
 * the filesystem path. Falls back to a safe default when nothing usable is
 * left.
 */
function safeFilename(raw: string | null): string {
  if (!raw) return "video.mp4";
  const cleaned = raw
    .replace(/[/\\]/g, "")
    .replace(/["\r\n]/g, "")
    .trim();
  return cleaned || "video.mp4";
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const url = params.get("url");
  const filename = safeFilename(params.get("filename"));

  if (!url) {
    return NextResponse.json(
      { error: "Missing url query parameter." },
      { status: 400 },
    );
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url." }, { status: 400 });
  }

  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return NextResponse.json(
      { error: "Only http(s) URLs are allowed." },
      { status: 400 },
    );
  }

  const upstream = await fetch(target, { redirect: "follow" });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: `Failed to fetch file (${upstream.status}).` },
      { status: 502 },
    );
  }

  const headers = new Headers({
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Content-Type": "video/mp4",
  });

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new NextResponse(upstream.body, { status: 200, headers });
}
