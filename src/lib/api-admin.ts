import "server-only";
import { connection, type NextRequest } from "next/server";
import { jsonError, serverError } from "@/lib/api";
import { requireAdminApi } from "@/lib/auth/guard";
import type { SessionPayload } from "@/lib/auth/token";
import { ConflictError } from "@/lib/errors";

/**
 * Bọc mọi Route Handler /api/admin/*:
 *  1) kiểm tra session ADMIN ở server (+ Origin cho method ghi),
 *  2) chuẩn hóa lỗi (409 cho xung đột, 500 chung — không lộ stack).
 */
export async function adminRoute(req: NextRequest, scope: string, fn: (session: SessionPayload) => Promise<Response>): Promise<Response> {
  await connection();
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  try {
    return await fn(auth.session);
  } catch (err) {
    if (err instanceof ConflictError) return jsonError(err.message, 409, err.field ? { fields: { [err.field]: err.message } } : undefined);
    return serverError(scope, err);
  }
}
