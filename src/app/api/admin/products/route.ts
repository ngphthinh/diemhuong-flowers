import { NextResponse, type NextRequest } from "next/server";
import { adminCreateProduct, adminListProducts } from "@/features/products/admin-service";
import { adminProductQuerySchema, productInputSchema } from "@/features/products/schema";
import { adminRoute } from "@/lib/api-admin";
import { jsonError, readJson, zodFieldErrors } from "@/lib/api";

export function GET(req: NextRequest) {
  return adminRoute(req, "GET /api/admin/products", async () => {
    const parsed = adminProductQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) return jsonError("Tham số không hợp lệ", 400, { fields: zodFieldErrors(parsed.error) });
    return NextResponse.json({ ok: true, data: await adminListProducts(parsed.data) });
  });
}

export function POST(req: NextRequest) {
  return adminRoute(req, "POST /api/admin/products", async () => {
    const body = await readJson(req);
    if (!body.ok) return body.response;
    const parsed = productInputSchema.safeParse(body.data);
    if (!parsed.success) return jsonError("Dữ liệu không hợp lệ", 400, { fields: zodFieldErrors(parsed.error) });
    return NextResponse.json({ ok: true, data: await adminCreateProduct(parsed.data) }, { status: 201 });
  });
}
