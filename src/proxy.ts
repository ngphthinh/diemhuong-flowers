import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";

/**
 * Lớp chặn "lạc quan" ở biên: chưa có session hợp lệ thì chuyển /admin/* về /admin/login.
 * KHÔNG phải ranh giới bảo mật duy nhất — quyền vẫn được kiểm tra lại ở server
 * trong layout admin (requireAdminPage) và mọi /api/admin/* (requireAdminApi).
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/admin/login";
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (session && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// /api/admin/* không bị chuyển hướng ở đây (trả 401 JSON từ requireAdminApi)
export const config = { matcher: ["/admin", "/admin/:path*"] };
