import { NextResponse, type NextRequest } from "next/server";
import { adminDeleteContact, adminGetContact, adminSetContactStatus } from "@/features/contact-requests/admin-service";
import { contactStatusUpdateSchema } from "@/features/contact-requests/schema";
import { adminRoute } from "@/lib/api-admin";
import { isObjectId, jsonError, readJson, zodFieldErrors } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };
const notFound = () => jsonError("Không tìm thấy yêu cầu", 404);

export function GET(req: NextRequest, { params }: Ctx) {
  return adminRoute(req, "GET /api/admin/contact-requests/[id]", async () => {
    const { id } = await params;
    const c = isObjectId(id) ? await adminGetContact(id) : null;
    return c ? NextResponse.json({ ok: true, data: c }) : notFound();
  });
}

export function PATCH(req: NextRequest, { params }: Ctx) {
  return adminRoute(req, "PATCH /api/admin/contact-requests/[id]", async () => {
    const { id } = await params;
    if (!isObjectId(id)) return notFound();
    const body = await readJson(req, 1_000);
    if (!body.ok) return body.response;
    const parsed = contactStatusUpdateSchema.safeParse(body.data);
    if (!parsed.success) return jsonError("Dữ liệu không hợp lệ", 400, { fields: zodFieldErrors(parsed.error) });
    const c = await adminSetContactStatus(id, parsed.data.status);
    return c ? NextResponse.json({ ok: true, data: c }) : notFound();
  });
}

export function DELETE(req: NextRequest, { params }: Ctx) {
  return adminRoute(req, "DELETE /api/admin/contact-requests/[id]", async () => {
    const { id } = await params;
    const ok = isObjectId(id) ? await adminDeleteContact(id) : false;
    return ok ? NextResponse.json({ ok: true }) : notFound();
  });
}
