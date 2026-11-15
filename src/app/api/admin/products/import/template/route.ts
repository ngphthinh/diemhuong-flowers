import type { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api-admin";
import { buildProductTemplate } from "@/features/products/excel/service";
import { xlsxResponse } from "@/features/products/excel/http";

/** Tải file Excel mẫu (tiêu đề, danh sách thả xuống, hướng dẫn, danh mục hiện có). */
export function GET(req: NextRequest) {
  return adminRoute(req, "GET /api/admin/products/import/template", async () =>
    xlsxResponse(await buildProductTemplate(), "mau-nhap-san-pham.xlsx"),
  );
}
