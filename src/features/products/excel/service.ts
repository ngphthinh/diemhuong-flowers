import "server-only";
import { connectDB } from "@/lib/db/mongoose";
import { Category } from "@/features/categories/model";
import { ConflictError } from "@/lib/errors";
import { adminCreateProduct, adminGetProduct, adminListAllProducts, adminListProducts, adminUpdateProduct } from "../admin-service";
import type { AdminProductDTO } from "../admin-types";
import type { AdminProductQuery } from "../schema";
import { buildErrorReportWorkbook, buildExportWorkbook, buildTemplateWorkbook } from "./build";
import { analyzeWorkbookBuffer, type Analysis, type ImportContext } from "./parse";
import { EXPORT_MAX_ROWS, type ImportCommitResult, type ImportPreview } from "./types";

/*
 * Đọc/kiểm tra file (parse.ts) và dựng file (build.ts) không biết gì về kho dữ liệu.
 * Mọi chỗ chạm MongoDB nằm trong file này: loadContext(), vòng ghi của commitProductImport(), exportProducts().
 */

async function loadCategories() {
  await connectDB();
  return Category.find().sort({ name: 1 }).collation({ locale: "vi" }).lean();
}

async function loadContext(): Promise<ImportContext> {
  const [categories, products] = await Promise.all([loadCategories(), adminListAllProducts()]);
  return {
    categories: categories.map((c) => ({ id: String(c._id), name: c.name, isActive: c.isActive })),
    products,
  };
}

export async function buildProductTemplate(): Promise<Buffer> {
  return buildTemplateWorkbook((await loadCategories()).map((c) => ({ name: c.name, isActive: c.isActive })));
}

async function analyze(buf: Buffer, fileName: string): Promise<Analysis> {
  return analyzeWorkbookBuffer(buf, await loadContext(), fileName);
}

export async function previewProductImport(buf: Buffer, fileName: string): Promise<ImportPreview> {
  return (await analyze(buf, fileName)).preview;
}

/** File Excel liệt kê các dòng lỗi (null nếu không có dòng lỗi). */
export async function buildProductImportErrorReport(buf: Buffer, fileName: string): Promise<Buffer | null> {
  const a = await analyze(buf, fileName);
  return a.preview.summary.error === 0 ? null : buildErrorReportWorkbook(a.rows);
}

/**
 * Ghi dữ liệu. Luôn đọc + kiểm tra LẠI file ở server (không tin kết quả preview do client gửi),
 * chỉ ghi các dòng hợp lệ; dòng lỗi bị bỏ qua.
 */
export async function commitProductImport(buf: Buffer, fileName: string): Promise<ImportCommitResult> {
  const a = await analyze(buf, fileName);
  const result: ImportCommitResult = { created: 0, updated: 0, unchanged: a.preview.summary.unchanged, skipped: a.preview.summary.error, failed: [] };

  // Ghi theo đúng thứ tự dòng trong file -> mã sản phẩm tăng dần theo thứ tự dòng.
  for (const r of a.ready) {
    try {
      const input = { ...r.input, salePrice: r.input.salePrice ?? undefined };
      if (r.action === "create") {
        await adminCreateProduct(input);
        result.created++;
      } else {
        const updated = await adminUpdateProduct(r.existingId!, input);
        if (updated) result.updated++;
        else result.failed.push({ row: r.row, message: "Sản phẩm đã bị xóa trong lúc nhập." });
      }
    } catch (e) {
      if (e instanceof ConflictError) result.failed.push({ row: r.row, message: e.message });
      else throw e;
    }
  }
  result.failed.sort((x, y) => x.row - y.row);
  return result;
}

export type ExportRequest =
  | { scope: "all" }
  | { scope: "filtered"; query: AdminProductQuery }
  | { scope: "selected"; ids: string[] };

export async function exportProducts(req: ExportRequest): Promise<{ buffer: Buffer; count: number }> {
  let products: AdminProductDTO[];
  if (req.scope === "selected") {
    const found = await Promise.all(req.ids.slice(0, EXPORT_MAX_ROWS).map((id) => adminGetProduct(id)));
    products = found.filter((p): p is AdminProductDTO => p !== null);
  } else {
    const base: AdminProductQuery = req.scope === "filtered" ? req.query : { sort: "newest", page: 1, pageSize: 1 };
    // Một "trang" đủ lớn để lấy hết kết quả (bỏ qua phân trang của UI)
    products = (await adminListProducts({ ...base, page: 1, pageSize: EXPORT_MAX_ROWS })).items;
  }
  return { buffer: buildExportWorkbook(products), count: products.length };
}
