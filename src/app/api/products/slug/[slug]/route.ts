import { NextResponse } from "next/server";
import { getProductBySlug } from "@/features/products/service";
import { jsonError, serverError } from "@/lib/api";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  try {
    const product = await getProductBySlug(slug);
    if (!product) return jsonError("Không tìm thấy sản phẩm", 404);
    return NextResponse.json({ ok: true, data: product });
  } catch (err) {
    return serverError("GET /api/products/slug/[slug]", err);
  }
}
