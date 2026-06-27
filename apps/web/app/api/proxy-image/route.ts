import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side image proxy.
 *
 * GitHub (`*.githubusercontent.com`, `github.com`), Google
 * (`*.googleusercontent.com`) and various other CDNs block or rate-limit
 * requests coming from AWS Lambda IP ranges. When a composition references such
 * an image and we render it on Lambda, the headless Chromium fetch fails and the
 * image renders blank. Routing those URLs through this same-origin proxy means
 * the fetch happens from our Next.js server (an allowed IP) instead.
 *
 * Usage: `/api/proxy-image?url=<encodedUrl>`
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");

  if (!target) {
    return NextResponse.json(
      { error: "Missing ?url= query parameter." },
      { status: 400 },
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid url." }, { status: 400 });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json(
      { error: "Only http(s) URLs can be proxied." },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      // A browser-like UA avoids some CDNs 403-ing unknown clients.
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MotionStudio/1.0)" },
      redirect: "follow",
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `Upstream responded ${upstream.status}.` },
        { status: 502 },
      );
    }

    const contentType =
      upstream.headers.get("content-type") ?? "application/octet-stream";

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        // Lambda renders the composition's <Img crossOrigin="anonymous">, which
        // requires the response to be CORS-readable; without this the image
        // fails to load / taints the canvas.
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to fetch image: ${message}` },
      { status: 502 },
    );
  }
}
