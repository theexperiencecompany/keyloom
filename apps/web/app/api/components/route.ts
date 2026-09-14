import { withAuth } from "@/lib/auth";
import {
  createComponent,
  ensureUserRow,
  listComponents,
} from "@/lib/components";

export async function GET() {
  const { user } = await withAuth();
  const rows = await listComponents(user.id);
  return Response.json(rows);
}

export async function POST(req: Request) {
  const { user } = await withAuth();

  const body = (await req.json().catch(() => null)) as {
    name?: unknown;
    baseId?: unknown;
    code?: unknown;
    exportName?: unknown;
  } | null;

  if (
    !body ||
    typeof body.name !== "string" ||
    typeof body.baseId !== "string" ||
    typeof body.code !== "string"
  ) {
    return new Response("name, baseId and code are required", { status: 400 });
  }

  // The fork row references the user row, so make sure it exists first.
  await ensureUserRow(user.id, user.email);

  const row = await createComponent(user.id, {
    name: body.name,
    baseId: body.baseId,
    code: body.code,
    exportName: typeof body.exportName === "string" ? body.exportName : null,
  });
  return Response.json(row);
}
