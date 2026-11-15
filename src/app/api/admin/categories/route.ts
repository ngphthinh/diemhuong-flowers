import { NextResponse, type NextRequest } from "next/server";
import { adminCreateCategory, adminListCategories } from "@/features/categories/admin-service";
import { adminCategoryQuerySchema, categoryInputSchema } from "@/features/categories/schema";
import { adminRoute } from "@/lib/api-admin";
import { jsonError, readJson, zodFieldErrors } from "@/lib/api";

export function GET(req: NextRequest) {
  return adminRoute(req, "GET /api/admin/categories", async () => {
    const parsed = adminCategoryQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) return jsonError("Tham số không hợp lệ", 400, { fields: zodFieldErrors(parsed.error) });
    return NextResponse.json({ ok: true, data: await adminListCategories(parsed.data) });
  });
}

export function POST(req: NextRequest) {
  return adminRoute(req, "POST /api/admin/categories", async () => {
    const body = await readJson(req, 10_000);
    if (!body.ok) return body.response;
    const parsed = categoryInputSchema.safeParse(body.data);
    if (!parsed.success) return jsonError("Dữ liệu không hợp lệ", 400, { fields: zodFieldErrors(parsed.error) });
    return NextResponse.json({ ok: true, data: await adminCreateCategory(parsed.data) }, { status: 201 });
  });
}
