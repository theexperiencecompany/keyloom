import { withAuth } from "@workos-inc/authkit-nextjs";
import { ensureAccount } from "@/lib/account";
import { createComponent, listComponents } from "@/lib/components";

export async function GET() {
  const { user } = await withAuth();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const rows = await listComponents(user.id);
  return Response.json(rows);
}

export async function POST(req: Request) {
  const { user } = await withAuth();
  if (!user) return new Response("Unauthorized", { status: 401 });

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

  // The user may not have an account row yet (FK target) — provision the free
  // tier first, same as the render guard does.
  await ensureAccount(user.id, user.email);

  const row = await createComponent(user.id, {
    name: body.name,
    baseId: body.baseId,
    code: body.code,
    exportName: typeof body.exportName === "string" ? body.exportName : null,
  });
  return Response.json(row);
}
