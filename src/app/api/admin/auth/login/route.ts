import { NextResponse, connection, type NextRequest } from "next/server";
import { adminLoginSchema } from "@/features/admins/schema";
import { verifyAdminCredentials } from "@/features/admins/service";
import { jsonError, readJson, serverError, zodFieldErrors } from "@/lib/api";
import { createSession } from "@/lib/auth/session";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  await connection();
  const rl = rateLimit(`login:${getClientIp(req.headers)}`, 10, 10 * 60 * 1000);
  if (!rl.ok) return jsonError("Thử đăng nhập quá nhiều lần. Vui lòng thử lại sau ít phút.", 429, { retryAfter: rl.retryAfter });

  const body = await readJson(req, 5_000);
  if (!body.ok) return body.response;
  const parsed = adminLoginSchema.safeParse(body.data);
  if (!parsed.success) return jsonError("Dữ liệu không hợp lệ", 400, { fields: zodFieldErrors(parsed.error) });

  try {
    const admin = await verifyAdminCredentials(parsed.data.email, parsed.data.password);
    // Thông báo chung: không cho biết email có tồn tại hay không
    if (!admin) return jsonError("Email hoặc mật khẩu không đúng", 401);
    await createSession({ sub: admin.id, email: admin.email, fullName: admin.fullName, role: "ADMIN" }, !!parsed.data.remember);
    return NextResponse.json({ ok: true, data: { email: admin.email, fullName: admin.fullName } });
  } catch (err) {
    return serverError("POST /api/admin/auth/login", err);
  }
}
