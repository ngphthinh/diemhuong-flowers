import "server-only";
import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { ImportFileError } from "./parse";
import { IMPORT_MAX_BYTES } from "./types";

export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Trả file .xlsx về trình duyệt (tên file ASCII + bản UTF-8 cho tên có dấu). */
export function xlsxResponse(buffer: Buffer, fileName: string, extra: Record<string, string> = {}): Response {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_MIME,
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extra,
    },
  });
}

/** Lấy file .xlsx từ multipart/form-data (field "file"): kiểm tra kích thước, đuôi file và chữ ký zip. */
export async function readUploadedXlsx(req: NextRequest): Promise<{ ok: true; buf: Buffer; fileName: string } | { ok: false; response: Response }> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > IMPORT_MAX_BYTES + 100_000) return { ok: false, response: jsonError("File tối đa 5MB.", 413) };

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return { ok: false, response: jsonError("Dữ liệu tải lên không hợp lệ.", 400) };
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, response: jsonError("Vui lòng chọn một file Excel (.xlsx).", 400) };
  if (file.size > IMPORT_MAX_BYTES) return { ok: false, response: jsonError("File tối đa 5MB.", 413) };

  const name = file.name.slice(0, 200);
  const ext = name.toLowerCase().split(".").pop();
  if (ext === "xls") return { ok: false, response: jsonError("File .xls (Excel cũ) không được hỗ trợ. Hãy mở file và “Lưu thành” định dạng .xlsx.", 415) };
  if (ext === "csv") return { ok: false, response: jsonError("File .csv không được hỗ trợ. Hãy dùng file Excel mẫu (.xlsx).", 415) };
  if (ext !== "xlsx") return { ok: false, response: jsonError("Chỉ nhận file Excel .xlsx.", 415) };

  const buf = Buffer.from(await file.arrayBuffer());
  // .xlsx thật là file zip: bắt đầu bằng "PK\x03\x04"
  if (buf.length < 4 || buf.readUInt32LE(0) !== 0x04034b50) return { ok: false, response: jsonError("File không phải Excel (.xlsx) hợp lệ.", 400) };
  return { ok: true, buf, fileName: name };
}

/** Lỗi do nội dung file (không phải lỗi hệ thống) -> 422 + thông báo cho người dùng. */
export async function withFileErrors(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ImportFileError) return jsonError(e.message, 422);
    throw e;
  }
}
