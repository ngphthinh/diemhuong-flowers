import { NextResponse, type NextRequest } from "next/server";
import { adminDeleteProduct, adminGetProduct, adminUpdateProduct } from "@/features/products/admin-service";
import { productUpdateSchema } from "@/features/products/schema";
import { adminRoute } from "@/lib/api-admin";
import { isObjectId, jsonError, readJson, zodFieldErrors } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export function GET(req: NextRequest, { params }: Ctx) {
  return adminRoute(req, "GET /api/admin/products/[id]", async () => {
    const { id } = await params;
    const p = isObjectId(id) ? await adminGetProduct(id) : null;
    return p ? NextResponse.json({ ok: true, data: p }) : jsonError("Không tìm thấy sản phẩm", 404);
  });
}

export function PUT(req: NextRequest, { params }: Ctx) {
  return adminRoute(req, "PUT /api/admin/products/[id]", async () => {
    const { id } = await params;
    if (!isObjectId(id)) return jsonError("Không tìm thấy sản phẩm", 404);
    const body = await readJson(req);
    if (!body.ok) return body.response;
    const parsed = productUpdateSchema.safeParse(body.data);
    if (!parsed.success) return jsonError("Dữ liệu không hợp lệ", 400, { fields: zodFieldErrors(parsed.error) });
    const p = await adminUpdateProduct(id, parsed.data);
    return p ? NextResponse.json({ ok: true, data: p }) : jsonError("Không tìm thấy sản phẩm", 404);
  });
}

export function DELETE(req: NextRequest, { params }: Ctx) {
  return adminRoute(req, "DELETE /api/admin/products/[id]", async () => {
    const { id } = await params;
    const ok = isObjectId(id) ? await adminDeleteProduct(id) : false;
    return ok ? NextResponse.json({ ok: true }) : jsonError("Không tìm thấy sản phẩm", 404);
  });
}
