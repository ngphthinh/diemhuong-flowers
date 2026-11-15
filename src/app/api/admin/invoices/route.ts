import { NextResponse, type NextRequest } from "next/server";
import { adminCreateInvoice, adminListInvoices } from "@/features/invoices/admin-service";
import { adminInvoiceQuerySchema, invoiceInputSchema } from "@/features/invoices/schema";
import { adminRoute } from "@/lib/api-admin";
import { jsonError, readJson, zodFieldErrors } from "@/lib/api";

export function GET(req: NextRequest) {
  return adminRoute(req, "GET /api/admin/invoices", async () => {
    const parsed = adminInvoiceQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) return jsonError("Tham số không hợp lệ", 400, { fields: zodFieldErrors(parsed.error) });
    return NextResponse.json({ ok: true, data: await adminListInvoices(parsed.data) });
  });
}

export function POST(req: NextRequest) {
  return adminRoute(req, "POST /api/admin/invoices", async (session) => {
    const body = await readJson(req);
    if (!body.ok) return body.response;
    const parsed = invoiceInputSchema.safeParse(body.data);
    if (!parsed.success) return jsonError("Dữ liệu không hợp lệ", 400, { fields: zodFieldErrors(parsed.error) });
    return NextResponse.json({ ok: true, data: await adminCreateInvoice(parsed.data, session.email) }, { status: 201 });
  });
}