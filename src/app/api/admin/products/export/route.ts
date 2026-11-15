import type { NextRequest } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/api-admin";
import { jsonError, readJson, zodFieldErrors } from "@/lib/api";
import { datedFileName } from "@/features/products/excel/build";
import { xlsxResponse } from "@/features/products/excel/http";
import { exportProducts, type ExportRequest } from "@/features/products/excel/service";
import { EXPORT_MAX_ROWS } from "@/features/products/excel/types";
import { adminProductQuerySchema } from "@/features/products/schema";

const bodySchema = z.object({
  scope: z.enum(["all", "filtered", "selected"]),
  /** Bộ lọc đang dùng ở trang danh sách (q, category, status, minPrice, maxPrice, sort). Phân trang bị bỏ qua. */
  query: z.record(z.string(), z.string()).optional(),
  ids: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(EXPORT_MAX_ROWS).optional(),
});

/** Xuất Excel: toàn bộ / theo bộ lọc / theo dòng đã chọn. */
export function POST(req: NextRequest) {
  return adminRoute(req, "POST /api/admin/products/export", async () => {
    const body = await readJson(req, 1_000_000);
    if (!body.ok) return body.response;
    const parsed = bodySchema.safeParse(body.data);
    if (!parsed.success) return jsonError("Dữ liệu không hợp lệ", 400, { fields: zodFieldErrors(parsed.error) });
    const { scope, query, ids } = parsed.data;

    let request: ExportRequest;
    let prefix = "san-pham";
    if (scope === "selected") {
      if (!ids?.length) return jsonError("Chưa chọn sản phẩm nào.", 400);
      request = { scope, ids };
      prefix = "san-pham-da-chon";
    } else if (scope === "filtered") {
      const q = adminProductQuerySchema.safeParse(query ?? {});
      if (!q.success) return jsonError("Bộ lọc không hợp lệ", 400, { fields: zodFieldErrors(q.error) });
      request = { scope, query: q.data };
      prefix = "san-pham-theo-bo-loc";
    } else {
      request = { scope };
    }

    const { buffer, count } = await exportProducts(request);
    return xlsxResponse(buffer, datedFileName(prefix), { "X-Export-Count": String(count) });
  });
}
