import "server-only";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { getSession } from "./session";
import type { SessionPayload } from "./token";

type ApiAuth = { ok: true; session: SessionPayload } | { ok: false; response: Response };

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Kiểm tra quyền ở SERVER cho mọi Route Handler /api/admin/*.
 * - Phải có session hợp lệ role ADMIN.
 * - Với method thay đổi dữ liệu: nếu có header Origin thì phải cùng host (lớp phòng CSRF bổ sung cho SameSite=Lax).
 */
export async function requireAdminApi(req: NextRequest): Promise<ApiAuth> {
  const session = await getSession();
  if (!session) return { ok: false, response: jsonError("Bạn cần đăng nhập", 401) };

  if (!SAFE_METHODS.has(req.method)) {
    const origin = req.headers.get("origin");
    if (origin) {
      let originHost = "";
      try {
        originHost = new URL(origin).host;
      } catch {
        /* origin hỏng -> từ chối bên dưới */
      }
      const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
      if (!originHost || originHost !== host) return { ok: false, response: jsonError("Yêu cầu không hợp lệ", 403) };
    }
  }
  return { ok: true, session };
}

/** Dùng trong Server Component/layout của /admin/*: chưa đăng nhập -> chuyển tới trang login. */
export async function requireAdminPage(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}
