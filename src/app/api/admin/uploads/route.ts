import { NextResponse, type NextRequest } from "next/server";
import { adminRoute } from "@/lib/api-admin";
import { jsonError } from "@/lib/api";
import { MAX_UPLOAD_BYTES, UploadError, storeImage } from "@/lib/uploads";

export function POST(req: NextRequest) {
  return adminRoute(req, "POST /api/admin/uploads", async () => {
    // Chặn sớm theo Content-Length (còn kiểm tra lại kích thước thật trong storeImage)
    const len = Number(req.headers.get("content-length") ?? 0);
    if (len > MAX_UPLOAD_BYTES + 100_000) return jsonError("Ảnh tối đa 5MB", 413);

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return jsonError("Dữ liệu tải lên không hợp lệ", 400);
    }
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("Thiếu file", 400);
    try {
      return NextResponse.json({ ok: true, data: { url: await storeImage(file) } }, { status: 201 });
    } catch (err) {
      if (err instanceof UploadError) return jsonError(err.message, err.status);
      throw err;
    }
  });
}
