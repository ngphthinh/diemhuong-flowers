import { NextResponse, connection, type NextRequest } from "next/server";
import { productListQuerySchema } from "@/features/products/schema";
import { listProducts } from "@/features/products/service";
import { jsonError, serverError, zodFieldErrors } from "@/lib/api";

export async function GET(req: NextRequest) {
  await connection();
  const parsed = productListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return jsonError("Tham số không hợp lệ", 400, { fields: zodFieldErrors(parsed.error) });
  try {
    return NextResponse.json({ ok: true, data: await listProducts(parsed.data) });
  } catch (err) {
    return serverError("GET /api/products", err);
  }
}
