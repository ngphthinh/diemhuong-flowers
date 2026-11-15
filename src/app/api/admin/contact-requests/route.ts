import { NextResponse, type NextRequest } from "next/server";
import { adminListContacts } from "@/features/contact-requests/admin-service";
import { adminContactQuerySchema } from "@/features/contact-requests/schema";
import { adminRoute } from "@/lib/api-admin";
import { jsonError, zodFieldErrors } from "@/lib/api";

export function GET(req: NextRequest) {
  return adminRoute(req, "GET /api/admin/contact-requests", async () => {
    const parsed = adminContactQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) return jsonError("Tham số không hợp lệ", 400, { fields: zodFieldErrors(parsed.error) });
    return NextResponse.json({ ok: true, data: await adminListContacts(parsed.data) });
  });
}
