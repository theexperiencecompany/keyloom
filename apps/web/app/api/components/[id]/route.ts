import { withAuth } from "@workos-inc/authkit-nextjs";
import {
  deleteComponent,
  getComponent,
  updateComponent,
} from "@/lib/components";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { user } = await withAuth();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const row = await getComponent(user.id, id);
  if (!row) return new Response("Not found", { status: 404 });
  return Response.json(row);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { user } = await withAuth();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;

  const body = (await req.json().catch(() => null)) as {
    name?: unknown;
    code?: unknown;
  } | null;
  const patch: { name?: string; code?: string } = {};
  if (typeof body?.name === "string") patch.name = body.name;
  if (typeof body?.code === "string") patch.code = body.code;

  const row = await updateComponent(user.id, id, patch);
  if (!row) return new Response("Not found", { status: 404 });
  return Response.json(row);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { user } = await withAuth();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  await deleteComponent(user.id, id);
  return new Response(null, { status: 204 });
}
