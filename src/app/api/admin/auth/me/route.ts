import { NextResponse, connection } from "next/server";
import { jsonError } from "@/lib/api";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  await connection();
  const s = await getSession();
  if (!s) return jsonError("Bạn cần đăng nhập", 401);
  return NextResponse.json({ ok: true, data: { id: s.sub, email: s.email, fullName: s.fullName, role: s.role } });
}
