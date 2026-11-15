import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** Chuẩn hóa lỗi Zod thành { field: message } — không lộ chi tiết nội bộ. */
export function zodFieldErrors(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function serverError(scope: string, err: unknown) {
  console.error(`[${scope}]`, err); // log ở server, trả thông báo chung cho client
  return jsonError("Đã có lỗi xảy ra, vui lòng thử lại sau.", 500);
}

/** Đọc JSON body an toàn: giới hạn kích thước, bắt lỗi parse. */
export async function readJson(req: Request, maxBytes = 100_000): Promise<{ ok: true; data: unknown } | { ok: false; response: Response }> {
  const raw = await req.text();
  if (raw.length > maxBytes) return { ok: false, response: jsonError("Nội dung quá lớn", 413) };
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch {
    return { ok: false, response: jsonError("Dữ liệu không hợp lệ", 400) };
  }
}

export const isObjectId = (v: string) => /^[a-f\d]{24}$/i.test(v);
