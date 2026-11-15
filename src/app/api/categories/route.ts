import { NextResponse, connection } from "next/server";
import { listActiveCategories } from "@/features/categories/service";
import { serverError } from "@/lib/api";

export async function GET() {
  await connection();
  try {
    return NextResponse.json({ ok: true, data: await listActiveCategories() });
  } catch (err) {
    return serverError("GET /api/categories", err);
  }
}
