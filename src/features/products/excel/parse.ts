/**
 * Đọc + kiểm tra dữ liệu import sản phẩm (thuần, không phụ thuộc kho dữ liệu).
 * Mọi quy tắc nghiệp vụ lấy lại từ productInputSchema (cùng schema với form admin) để không lệch nhau.
 */
import { readWorkbook, XlsxError, type ParsedSheet, type RawCell } from "@/lib/xlsx/read";
import { foldVi } from "@/lib/utils";
import { productInputSchema, type ProductInput } from "../schema";
import { COLUMNS, COLUMN_BY_KEY, headerToKey, type ColumnKey } from "./columns";
import { IMPORT_MAX_ROWS, type ImportIssue, type ImportPreview, type ImportRowPreview } from "./types";

export class ImportFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportFileError";
  }
}

export interface ImportCategory {
  id: string;
  name: string;
  isActive: boolean;
}

/** Sản phẩm hiện có, đủ để so khớp mã / phát hiện "không thay đổi". */
export interface ImportExisting {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  images: string[];
  categoryId: string;
  flowerType: string[];
  occasion: string[];
  availability: "IN_STOCK" | "OUT_OF_STOCK";
  isFeatured: boolean;
  isActive: boolean;
}

export interface ImportContext {
  categories: ImportCategory[];
  products: ImportExisting[];
}

/** Dòng đã qua kiểm tra, sẵn sàng ghi. */
export interface ReadyRow {
  row: number;
  action: "create" | "update";
  existingId?: string;
  input: ProductInput;
}

export interface AnalyzedRow {
  preview: ImportRowPreview;
  /** Giá trị ô gốc (dạng chữ) theo thứ tự COLUMNS — dùng cho file báo lỗi. */
  cells: string[];
}

export interface Analysis {
  preview: ImportPreview;
  rows: AnalyzedRow[];
  ready: ReadyRow[];
}

// ---------- chuyển đổi ô ----------

const cellText = (v: RawCell | undefined): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "Có" : "Không";
  return String(v).replace(/\r\n?/g, "\n").trim();
};

/** "1.290.000", "1,290,000", "690000đ", 690000 -> số. undefined = trống. "invalid" = không đọc được. */
export function parseMoney(v: RawCell | undefined): number | undefined | "invalid" {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : "invalid";
  if (typeof v === "boolean") return "invalid";
  const s = v.replace(/vn[đd]|[đ₫]/gi, "").replace(/\s+/g, "");
  if (s === "") return undefined;
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return Number(s.replace(/[.,]/g, ""));
  if (/^\d+([.,]\d+)?$/.test(s)) return Number(s.replace(",", "."));
  return "invalid";
}

const TRUE_TOKENS = new Set(["co", "yes", "true", "1", "x", "y", "hien", "hien thi"]);
const FALSE_TOKENS = new Set(["khong", "no", "false", "0", "n", "an"]);

function parseBool(v: RawCell | undefined): boolean | undefined | "invalid" {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1 ? true : v === 0 ? false : "invalid";
  const t = foldVi(cellText(v));
  if (t === "") return undefined;
  if (TRUE_TOKENS.has(t)) return true;
  if (FALSE_TOKENS.has(t)) return false;
  return "invalid";
}

function parseAvailability(v: RawCell | undefined): "IN_STOCK" | "OUT_OF_STOCK" | undefined | "invalid" {
  const t = foldVi(cellText(v)).replace(/[_\s]+/g, " ");
  if (t === "") return undefined;
  if (t === "con hang" || t === "in stock" || t === "instock") return "IN_STOCK";
  if (t === "het hang" || t === "out of stock" || t === "outofstock") return "OUT_OF_STOCK";
  return "invalid";
}

/** Tách danh sách: xuống dòng, dấu phẩy, chấm phẩy, "|". Bỏ rỗng, bỏ trùng (không phân biệt hoa/thường). */
function splitList(text: string, extra = ""): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of text.split(new RegExp(`[\\n,;|${extra}]+`))) {
    const p = part.trim();
    const k = p.toLowerCase();
    if (p && !seen.has(k)) {
      seen.add(k);
      out.push(p);
    }
  }
  return out;
}

const splitImages = (text: string): string[] => {
  const seen = new Set<string>();
  return text
    .split(/[\s,;|]+/)
    .map((s) => s.trim())
    .filter((s) => s && !seen.has(s) && seen.add(s));
};

// ---------- chọn sheet + dòng tiêu đề ----------

export function pickSheet(sheets: ParsedSheet[]): ParsedSheet {
  return (
    sheets.find((s) => foldVi(s.name) === "san pham") ??
    sheets.find((s) => s.rows.some((r) => r.some((c) => typeof c === "string" && headerToKey(c) === "name"))) ??
    sheets[0]
  );
}

function findHeader(rows: RawCell[][]): { index: number; map: Map<number, ColumnKey> } {
  let best = { index: -1, map: new Map<number, ColumnKey>() };
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const map = new Map<number, ColumnKey>();
    const used = new Set<ColumnKey>();
    (rows[i] ?? []).forEach((cell, c) => {
      if (typeof cell !== "string") return;
      const key = headerToKey(cell);
      if (key && !used.has(key)) {
        used.add(key);
        map.set(c, key);
      }
    });
    if (map.size > best.map.size) best = { index: i, map };
  }
  if (best.index < 0 || best.map.size < 3) {
    throw new ImportFileError("Không tìm thấy dòng tiêu đề. Hãy dùng đúng file Excel mẫu (tải ở nút “Tải Excel mẫu”).");
  }
  return best;
}

// ---------- so sánh để phát hiện "không thay đổi" ----------

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
const normText = (s: string) => s.replace(/\r\n?/g, "\n").trim();

function isUnchanged(e: ImportExisting, i: ProductInput): boolean {
  return (
    e.name.trim() === i.name &&
    normText(e.description) === i.description &&
    e.price === i.price &&
    (e.salePrice ?? null) === (i.salePrice ?? null) &&
    e.categoryId === i.categoryId &&
    e.availability === i.availability &&
    e.isFeatured === i.isFeatured &&
    e.isActive === i.isActive &&
    sameList(e.images, i.images) &&
    sameList(e.flowerType, i.flowerType) &&
    sameList(e.occasion, i.occasion)
  );
}

// ---------- phân tích ----------

const ZOD_PATH_TO_COLUMN: Record<string, ColumnKey> = {
  name: "name", description: "description", price: "price", salePrice: "salePrice", images: "images",
  categoryId: "category", flowerType: "flowerType", occasion: "occasion", availability: "availability",
  isFeatured: "isFeatured", isActive: "isActive",
};

export function analyzeSheet(sheet: ParsedSheet, ctx: ImportContext, fileName = ""): Analysis {
  const { index: headerIndex, map: colMap } = findHeader(sheet.rows);

  const present = new Set(colMap.values());
  const missing = COLUMNS.filter((c) => c.required && !present.has(c.key)).map((c) => `“${c.label}”`);
  if (missing.length) throw new ImportFileError(`File thiếu cột bắt buộc: ${missing.join(", ")}. Hãy dùng đúng file Excel mẫu.`);

  // Các dòng dữ liệu (bỏ dòng trống hoàn toàn)
  const dataRows: { row: number; cells: RawCell[] }[] = [];
  for (let r = headerIndex + 1; r < sheet.rows.length; r++) {
    const cells = sheet.rows[r] ?? [];
    if (cells.some((c) => c !== null && c !== undefined && String(c).trim() !== "")) dataRows.push({ row: r + 1, cells });
  }
  if (dataRows.length === 0) throw new ImportFileError("File không có dòng dữ liệu nào để nhập.");
  if (dataRows.length > IMPORT_MAX_ROWS) {
    throw new ImportFileError(`File có ${dataRows.length} dòng, tối đa ${IMPORT_MAX_ROWS} dòng mỗi lần nhập. Hãy chia nhỏ file.`);
  }

  const catByName = new Map(ctx.categories.map((c) => [foldVi(c.name).replace(/\s+/g, " ").trim(), c]));
  const byCode = new Map(ctx.products.map((p) => [p.code.toUpperCase(), p]));
  const existingByName = new Map<string, ImportExisting>();
  for (const p of ctx.products) if (!existingByName.has(foldVi(p.name).trim())) existingByName.set(foldVi(p.name).trim(), p);

  const seenCodes = new Map<string, number>(); // code -> số dòng đầu tiên
  const seenNewNames = new Map<string, number>();

  const rows: AnalyzedRow[] = [];
  const ready: ReadyRow[] = [];

  for (const { row, cells } of dataRows) {
    const raw = {} as Record<ColumnKey, RawCell | undefined>;
    for (const [c, key] of colMap) raw[key] = cells[c] ?? null;
    const text = (k: ColumnKey) => cellText(raw[k]);

    const errors: ImportIssue[] = [];
    const warnings: string[] = [];
    const errored = new Set<ColumnKey>();
    const fail = (key: ColumnKey, message: string) => {
      if (errored.has(key)) return; // mỗi cột chỉ báo 1 lỗi đầu tiên
      errored.add(key);
      errors.push({ column: COLUMN_BY_KEY[key].label, message });
    };

    // --- mã sản phẩm -> thêm mới hay cập nhật
    const codeText = text("code").toUpperCase().replace(/\s+/g, "");
    let existing: ImportExisting | undefined;
    if (codeText) {
      if (!/^HOA-\d{1,10}$/.test(codeText)) fail("code", "Mã không đúng định dạng (vd. HOA-000012). Để trống nếu muốn thêm mới.");
      else {
        existing = byCode.get(codeText);
        if (!existing) fail("code", `Không tìm thấy sản phẩm có mã ${codeText}. Để trống ô này nếu muốn thêm mới.`);
        const dup = seenCodes.get(codeText);
        if (dup) fail("code", `Trùng mã ${codeText} với dòng ${dup}.`);
        else seenCodes.set(codeText, row);
      }
    }

    // --- danh mục
    let category: ImportCategory | undefined;
    const catText = text("category");
    if (catText) {
      category = catByName.get(foldVi(catText).replace(/\s+/g, " ").trim());
      if (!category) fail("category", `Danh mục “${catText}” không tồn tại. Chọn từ danh sách ở sheet “Danh mục”.`);
    }

    // --- số
    const price = parseMoney(raw.price);
    if (price === "invalid") fail("price", "Giá phải là số (vd. 690000).");
    else if (price === undefined) fail("price", "Vui lòng nhập giá (ô trống hoặc công thức chưa được tính — hãy nhập số trực tiếp).");
    const salePrice = parseMoney(raw.salePrice);
    if (salePrice === "invalid") fail("salePrice", "Giá khuyến mãi phải là số (vd. 590000).");

    // --- cờ / tình trạng
    const availability = parseAvailability(raw.availability);
    if (availability === "invalid") fail("availability", "Chỉ nhận “Còn hàng” hoặc “Hết hàng”.");
    const isFeatured = parseBool(raw.isFeatured);
    if (isFeatured === "invalid") fail("isFeatured", "Chỉ nhận “Có” hoặc “Không”.");
    const isActive = parseBool(raw.isActive);
    if (isActive === "invalid") fail("isActive", "Chỉ nhận “Có” hoặc “Không”.");

    // --- đối tượng đưa vào Zod (cùng luật với form admin)
    const candidate = {
      name: text("name"),
      description: text("description"),
      price: typeof price === "number" ? price : undefined,
      salePrice: typeof salePrice === "number" ? salePrice : undefined,
      images: splitImages(text("images")),
      categoryId: category?.id ?? "",
      flowerType: splitList(text("flowerType")),
      occasion: splitList(text("occasion")),
      availability: availability && availability !== "invalid" ? availability : "IN_STOCK",
      isFeatured: typeof isFeatured === "boolean" ? isFeatured : false,
      isActive: typeof isActive === "boolean" ? isActive : true,
    };
    const parsed = productInputSchema.safeParse(candidate);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = ZOD_PATH_TO_COLUMN[String(issue.path[0])];
        if (!key) continue;
        // Lỗi riêng cho danh mục/giá đã được báo ở trên (nếu có) -> fail() tự bỏ qua trùng lặp
        let msg = issue.message;
        if (key === "images" && typeof issue.path[1] === "number") msg = `Ảnh thứ ${issue.path[1] + 1}: ${msg}`;
        if (key === "category" && catText) continue;
        if (key === "price" && price === "invalid") continue;
        if (key === "salePrice" && salePrice === "invalid") continue;
        fail(key, msg);
      }
    }

    // --- cảnh báo (không chặn)
    if (parsed.success && errors.length === 0) {
      if (category && !category.isActive) warnings.push(`Danh mục “${category.name}” đang tắt — sản phẩm sẽ không hiển thị ở trang khách.`);
      if (!existing) {
        const nameKey = foldVi(parsed.data.name).trim();
        const dupExisting = existingByName.get(nameKey);
        const dupRow = seenNewNames.get(nameKey);
        if (dupExisting) warnings.push(`Tên trùng với sản phẩm đã có (${dupExisting.code}) — vẫn sẽ thêm mới.`);
        else if (dupRow) warnings.push(`Tên trùng với dòng ${dupRow} trong file.`);
        if (!dupRow) seenNewNames.set(nameKey, row);
      }
    }

    // Lỗi theo thứ tự cột trong file mẫu cho dễ đọc
    const colOrder = (label: string) => COLUMNS.findIndex((c) => c.label === label);
    errors.sort((x, y) => colOrder(x.column) - colOrder(y.column));

    let action: ImportRowPreview["action"] = "error";
    if (errors.length === 0 && parsed.success) {
      if (existing) action = isUnchanged(existing, parsed.data) ? "unchanged" : "update";
      else action = "create";
      if (action === "create" || action === "update") ready.push({ row, action, existingId: existing?.id, input: parsed.data });
    }

    rows.push({
      cells: COLUMNS.map((c) => text(c.key)),
      preview: {
        row,
        action,
        code: existing?.code ?? codeText,
        name: text("name"),
        categoryName: category?.name ?? catText,
        price: typeof price === "number" ? price : null,
        salePrice: typeof salePrice === "number" ? salePrice : null,
        errors,
        warnings,
      },
    });
  }

  const count = (a: ImportRowPreview["action"]) => rows.filter((r) => r.preview.action === a).length;
  return {
    rows,
    ready,
    preview: {
      fileName,
      sheetName: sheet.name,
      rows: rows.map((r) => r.preview),
      summary: {
        total: rows.length,
        create: count("create"),
        update: count("update"),
        unchanged: count("unchanged"),
        error: count("error"),
        warning: rows.filter((r) => r.preview.warnings.length > 0).length,
      },
    },
  };
}

/** Đọc buffer .xlsx -> phân tích. Ném ImportFileError với thông báo tiếng Việt khi file không dùng được. */
export function analyzeWorkbookBuffer(buf: Buffer, ctx: ImportContext, fileName = ""): Analysis {
  let sheets: ParsedSheet[];
  try {
    sheets = readWorkbook(buf);
  } catch (e) {
    if (e instanceof XlsxError) throw new ImportFileError(e.message);
    throw e;
  }
  return analyzeSheet(pickSheet(sheets), ctx, fileName);
}
