import { NextResponse } from "next/server";
import { getProductById } from "@/features/products/service";
import { jsonError, serverError } from "@/lib/api";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const product = await getProductById(id);
    if (!product) return jsonError("Không tìm thấy sản phẩm", 404);
    return NextResponse.json({ ok: true, data: product });
  } catch (err) {
    return serverError("GET /api/products/[id]", err);
  }
}
