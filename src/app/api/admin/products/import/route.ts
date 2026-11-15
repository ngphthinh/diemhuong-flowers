import { NextResponse, type NextRequest } from "next/server";
import { adminRoute } from "@/lib/api-admin";
import { readUploadedXlsx, withFileErrors } from "@/features/products/excel/http";
import { commitProductImport } from "@/features/products/excel/service";

/**
 * Nhập dữ liệu. Server đọc + kiểm tra LẠI file (không tin preview của client);
 * chỉ ghi các dòng hợp lệ, bỏ qua dòng lỗi.
 */
export function POST(req: NextRequest) {
  return adminRoute(req, "POST /api/admin/products/import", async () => {
    const up = await readUploadedXlsx(req);
    if (!up.ok) return up.response;
    return withFileErrors(async () => NextResponse.json({ ok: true, data: await commitProductImport(up.buf, up.fileName) }));
  });
}
