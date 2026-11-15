// Kiểu dùng chung cho server + client (không import gì phía server).

export type ImportAction = "create" | "update" | "unchanged" | "error";

export interface ImportIssue {
  /** Tên cột hiển thị (vd. "Giá"). */
  column: string;
  message: string;
}

/** "Giá: Giá phải là số" -> "Giá phải là số" (không lặp tên cột khi thông báo đã nhắc tới). */
export function formatIssue(i: ImportIssue): string {
  return i.message.toLowerCase().startsWith(i.column.toLowerCase()) ? i.message : `${i.column}: ${i.message}`;
}

export interface ImportRowPreview {
  /** Số dòng trong file Excel (dòng 1 là tiêu đề). */
  row: number;
  action: ImportAction;
  code: string;
  name: string;
  categoryName: string;
  price: number | null;
  salePrice: number | null;
  errors: ImportIssue[];
  warnings: string[];
}

export interface ImportSummary {
  total: number;
  create: number;
  update: number;
  unchanged: number;
  error: number;
  /** Số dòng có cảnh báo (không chặn nhập). */
  warning: number;
}

export interface ImportPreview {
  fileName: string;
  sheetName: string;
  summary: ImportSummary;
  rows: ImportRowPreview[];
}

export interface ImportCommitResult {
  created: number;
  updated: number;
  unchanged: number;
  /** Dòng bị bỏ qua vì lỗi dữ liệu. */
  skipped: number;
  /** Dòng hợp lệ lúc kiểm tra nhưng lỗi khi ghi (hiếm: dữ liệu đổi giữa chừng). */
  failed: { row: number; message: string }[];
}

export const IMPORT_MAX_BYTES = 5 * 1024 * 1024;
export const IMPORT_MAX_ROWS = 1000;
export const EXPORT_MAX_ROWS = 10_000;
