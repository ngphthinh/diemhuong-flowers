import { NextResponse, type NextRequest } from "next/server";
import { contactRequestInputSchema } from "@/features/contact-requests/schema";
import { createContactRequest } from "@/features/contact-requests/service";
import { jsonError, serverError, zodFieldErrors } from "@/lib/api";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 10_000;

export async function POST(req: NextRequest) {
  // 1. Rate limit: tối đa 5 yêu cầu / 10 phút / IP
  const rl = rateLimit(`contact:${getClientIp(req.headers)}`, 5, 10 * 60 * 1000);
  if (!rl.ok) {
    return jsonError("Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.", 429, { retryAfter: rl.retryAfter });
  }

  // 2. Giới hạn kích thước + parse JSON an toàn
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return jsonError("Nội dung quá dài", 413);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return jsonError("Dữ liệu không hợp lệ", 400);
  }

  // 3. Validate bằng Zod ở server
  const parsed = contactRequestInputSchema.safeParse(body);
  if (!parsed.success) return jsonError("Dữ liệu không hợp lệ", 400, { fields: zodFieldErrors(parsed.error) });

  // 4. Honeypot: bot điền ô ẩn -> giả vờ thành công, không lưu
  if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 201 });

  try {
    await createContactRequest(parsed.data);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return serverError("POST /api/contact-requests", err);
  }
}
