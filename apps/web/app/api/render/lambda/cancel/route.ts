import { type AwsRegion, deleteRender } from "@remotion/lambda/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function env(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export async function POST(request: Request) {
  try {
    const region = env("REMOTION_AWS_REGION");
    if (!region) {
      throw new Error("REMOTION_AWS_REGION is not configured.");
    }

    const body = (await request.json()) as {
      renderId?: unknown;
      bucketName?: unknown;
    };

    if (
      typeof body.renderId !== "string" ||
      typeof body.bucketName !== "string"
    ) {
      throw new Error("Missing Lambda render cancellation identifiers.");
    }

    const result = await deleteRender({
      region: region as AwsRegion,
      bucketName: body.bucketName,
      renderId: body.renderId,
    });

    return NextResponse.json({ freedBytes: result.freedBytes });
  } catch (err) {
    console.error("[lambda-render] cancel failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
