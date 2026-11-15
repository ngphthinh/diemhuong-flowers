import { NextResponse, connection } from "next/server";
import { connectDB } from "@/lib/db/mongoose";

/** Kiểm tra kết nối DB. Không trả stack trace hay chi tiết lỗi cho client. */
export async function GET() {
  await connection(); // đánh dấu dynamic (cacheComponents bật nên không dùng `export const dynamic`)
  try {
    const m = await connectDB();
    await m.connection.db?.admin().ping();
    return NextResponse.json({ ok: true, db: "connected" });
  } catch (err) {
    console.error("[health] DB error:", err);
    return NextResponse.json({ ok: false, db: "unavailable" }, { status: 503 });
  }
}
