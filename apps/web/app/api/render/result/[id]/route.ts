import fs from "node:fs/promises";
import { consumeRender } from "@/lib/render-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const entry = consumeRender(id);
  if (!entry) {
    return new Response("Render not found or expired.", { status: 404 });
  }
  let data: Buffer;
  try {
    data = await fs.readFile(entry.filePath);
  } catch (err) {
    console.error("[api/render/result] read failed", err);
    return new Response("Render file missing.", { status: 410 });
  }
  // Best-effort cleanup; the consume() above already removed it from the map.
  void fs.unlink(entry.filePath).catch(() => {});

  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      "content-type": "video/mp4",
      "content-length": String(data.byteLength),
      "content-disposition": `attachment; filename="${entry.filename}"`,
      "cache-control": "no-store",
    },
  });
}
