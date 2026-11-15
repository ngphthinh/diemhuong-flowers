import { NextResponse, type NextRequest } from "next/server";
import { adminDeleteCategory, adminSetCategoryActive, adminUpdateCategory } from "@/features/categories/admin-service";
import { categoryInputSchema, categoryPatchSchema } from "@/features/categories/schema";
import { adminRoute } from "@/lib/api-admin";
import { isObjectId, jsonError, readJson, zodFieldErrors } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };
const notFound = () => jsonError("Không tìm thấy danh mục", 404);

export function PUT(req: NextRequest, { params }: Ctx) {
  return adminRoute(req, "PUT /api/admin/categories/[id]", async () => {
    const { id } = await params;
    if (!isObjectId(id)) return notFound();
    const body = await readJson(req, 10_000);
    if (!body.ok) return body.response;
    const parsed = categoryInputSchema.safeParse(body.data);
    if (!parsed.success) return jsonError("Dữ liệu không hợp lệ", 400, { fields: zodFieldErrors(parsed.error) });
    const c = await adminUpdateCategory(id, parsed.data);
    return c ? NextResponse.json({ ok: true, data: c }) : notFound();
  });
}

/** Bật/tắt trạng thái nhanh. */
export function PATCH(req: NextRequest, { params }: Ctx) {
  return adminRoute(req, "PATCH /api/admin/categories/[id]", async () => {
    const { id } = await params;
    if (!isObjectId(id)) return notFound();
    const body = await readJson(req, 1_000);
    if (!body.ok) return body.response;
    const parsed = categoryPatchSchema.safeParse(body.data);
    if (!parsed.success) return jsonError("Dữ liệu không hợp lệ", 400, { fields: zodFieldErrors(parsed.error) });
    const c = await adminSetCategoryActive(id, parsed.data.isActive);
    return c ? NextResponse.json({ ok: true, data: c }) : notFound();
  });
}

export function DELETE(req: NextRequest, { params }: Ctx) {
  return adminRoute(req, "DELETE /api/admin/categories/[id]", async () => {
    const { id } = await params;
    if (!isObjectId(id)) return notFound();
    const r = await adminDeleteCategory(id);
    if (r.result === "not_found") return notFound();
    if (r.result === "in_use")
      return jsonError(`Danh mục đang có ${r.productCount} sản phẩm. Hãy chuyển hoặc xóa các sản phẩm đó trước khi xóa danh mục.`, 409, { productCount: r.productCount });
    return NextResponse.json({ ok: true });
  });
}
