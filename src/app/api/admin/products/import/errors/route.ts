import type { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api-admin";
import { jsonError } from "@/lib/api";
import { datedFileName } from "@/features/products/excel/build";
import { readUploadedXlsx, withFileErrors, xlsxResponse } from "@/features/products/excel/http";
import { buildProductImportErrorReport } from "@/features/products/excel/service";

/** Tải file Excel chứa các dòng lỗi (kèm lý do) để sửa rồi nhập lại. */
export function POST(req: NextRequest) {
  return adminRoute(req, "POST /api/admin/products/import/errors", async () => {
    const up = await readUploadedXlsx(req);
    if (!up.ok) return up.response;
    return withFileErrors(async () => {
      const report = await buildProductImportErrorReport(up.buf, up.fileName);
      if (!report) return jsonError("File không có dòng lỗi nào.", 404);
      return xlsxResponse(report, datedFileName("dong-loi-nhap-san-pham"));
    });
  });
}
