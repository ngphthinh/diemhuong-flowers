/**
 * Dựng file Excel: mẫu nhập, export sản phẩm, báo cáo dòng lỗi. Thuần (không đụng kho dữ liệu).
 */
import { buildWorkbook, type CellValue, type SheetColumn, type SheetInput } from "@/lib/xlsx/write";
import { AVAILABILITY_LABEL, COLUMNS, NO_LABEL, YES_LABEL } from "./columns";
import type { AnalyzedRow } from "./parse";
import type { AdminProductDTO } from "../admin-types";
import { formatIssue } from "./types";

const HEADERS = COLUMNS.map((c) => c.header);

function productColumns(): SheetColumn[] {
  return COLUMNS.map((c): SheetColumn => {
    const col: SheetColumn = { width: c.width };
    if (c.key === "code") col.text = true;
    if (c.key === "price" || c.key === "salePrice") col.numberFormat = "integer";
    if (c.key === "description" || c.key === "images" || c.key === "flowerType" || c.key === "occasion") col.wrap = true;
    return col;
  });
}

const colIndex = (key: string) => COLUMNS.findIndex((c) => c.key === key);

/** File mẫu: sheet "Sản phẩm" (chỉ tiêu đề + dropdown), "Hướng dẫn", "Danh mục". */
export function buildTemplateWorkbook(categories: { name: string; isActive: boolean }[]): Buffer {
  const catCount = categories.length;
  const data: SheetInput = {
    name: "Sản phẩm",
    rows: [HEADERS],
    columns: productColumns(),
    freezeHeader: true,
    validations: [
      ...(catCount > 0
        ? [{ col: colIndex("category"), list: { ref: `'Danh mục'!$A$2:$A$${catCount + 1}` }, title: "Danh mục", message: "Chọn một danh mục có sẵn." }]
        : []),
      { col: colIndex("availability"), list: [AVAILABILITY_LABEL.IN_STOCK, AVAILABILITY_LABEL.OUT_OF_STOCK] },
      { col: colIndex("isFeatured"), list: [YES_LABEL, NO_LABEL] },
      { col: colIndex("isActive"), list: [YES_LABEL, NO_LABEL] },
    ],
  };

  const guideRows: CellValue[][] = [
    ["Cột", "Bắt buộc", "Quy tắc", "Ví dụ"],
    ...COLUMNS.map((c) => [c.header.replace(/\s*\*$/, ""), c.required ? "Có" : "Không", c.help, c.example]),
    [],
    ["Lưu ý chung"],
    ["• Nhập dữ liệu ở sheet “Sản phẩm”, bắt đầu từ dòng 2. KHÔNG đổi tên/thứ tự/xóa dòng tiêu đề.", "", "", ""],
    ["• Mỗi lần nhập tối đa 1.000 dòng, file .xlsx tối đa 5MB.", "", "", ""],
    ["• Dòng có Mã sản phẩm = CẬP NHẬT: ghi đè toàn bộ các cột của sản phẩm đó (ô trống = xóa giá trị / dùng mặc định).", "", "", ""],
    ["• Dòng để trống Mã sản phẩm = THÊM MỚI. Hệ thống tự sinh mã và đường dẫn (slug).", "", "", ""],
    ["• Hệ thống luôn cho xem trước và báo lỗi từng dòng trước khi ghi. Dòng lỗi sẽ bị bỏ qua, dòng hợp lệ vẫn được nhập.", "", "", ""],
    ["• Có thể dùng file Export làm file nhập: sửa dữ liệu rồi nhập lại (cột “Ngày tạo” được bỏ qua).", "", "", ""],
  ];
  const guide: SheetInput = {
    name: "Hướng dẫn",
    rows: guideRows,
    columns: [{ width: 24 }, { width: 11 }, { width: 80, wrap: true }, { width: 48, wrap: true }],
    noteRows: guideRows.map((_, i) => i).filter((i) => i > COLUMNS.length + 1),
    freezeHeader: true,
  };

  const cats: SheetInput = {
    name: "Danh mục",
    rows: [["Tên danh mục", "Trạng thái"], ...categories.map((c) => [c.name, c.isActive ? "Đang hiển thị" : "Đang tắt"])],
    columns: [{ width: 32 }, { width: 16 }],
    freezeHeader: true,
  };
  return buildWorkbook([data, guide, cats]);
}

const vnDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" });

/** File export: cùng cột với file mẫu (+ "Ngày tạo") nên có thể sửa rồi nhập lại. */
export function buildExportWorkbook(products: AdminProductDTO[]): Buffer {
  const rows: CellValue[][] = [
    [...HEADERS, "Ngày tạo"],
    ...products.map((p) => [
      p.code,
      p.name,
      p.description,
      p.price,
      p.salePrice ?? null,
      p.categoryName,
      p.flowerType.join(", "),
      p.occasion.join(", "),
      AVAILABILITY_LABEL[p.availability],
      p.isFeatured ? YES_LABEL : NO_LABEL,
      p.isActive ? YES_LABEL : NO_LABEL,
      p.images.join("\n"),
      vnDate.format(new Date(p.createdAt)),
    ]),
  ];
  return buildWorkbook([{ name: "Sản phẩm", rows, columns: [...productColumns(), { width: 18 }], freezeHeader: true }]);
}

/** Báo cáo lỗi: giữ nguyên các cột gốc để sửa tại chỗ rồi nhập lại; thêm "Dòng" và "Lỗi" ở cuối (được bỏ qua khi nhập). */
export function buildErrorReportWorkbook(rows: AnalyzedRow[]): Buffer {
  const failed = rows.filter((r) => r.preview.action === "error");
  const body: CellValue[][] = failed.map((r) => [
    ...r.cells,
    r.preview.row,
    r.preview.errors.map(formatIssue).join("\n"),
  ]);
  const errCols = [COLUMNS.length, COLUMNS.length + 1];
  return buildWorkbook([
    {
      name: "Sản phẩm",
      rows: [[...HEADERS, "Dòng gốc", "Lỗi cần sửa"], ...body],
      columns: [...productColumns(), { width: 10 }, { width: 70, wrap: true }],
      freezeHeader: true,
      errorHeaderCols: errCols,
    },
  ]);
}

/** Tên file theo ngày giờ (giờ Việt Nam): san-pham_2026-11-15_1452.xlsx */
export function datedFileName(prefix: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const p = (t: string) => parts.find((x) => x.type === t)?.value ?? "00";
  return `${prefix}_${p("year")}-${p("month")}-${p("day")}_${p("hour")}${p("minute")}.xlsx`;
}
