import { NextResponse, type NextRequest } from "next/server";
import { adminGetSettings, adminUpdateSettings } from "@/features/store-settings/admin-service";
import { storeSettingsInputSchema } from "@/features/store-settings/schema";
import { adminRoute } from "@/lib/api-admin";
import { jsonError, readJson, zodFieldErrors } from "@/lib/api";

export function GET(req: NextRequest) {
  return adminRoute(req, "GET /api/admin/store-settings", async () => NextResponse.json({ ok: true, data: await adminGetSettings() }));
}

export function PUT(req: NextRequest) {
  return adminRoute(req, "PUT /api/admin/store-settings", async () => {
    const body = await readJson(req, 10_000);
    if (!body.ok) return body.response;
    const parsed = storeSettingsInputSchema.safeParse(body.data);
    if (!parsed.success) return jsonError("Dữ liệu không hợp lệ", 400, { fields: zodFieldErrors(parsed.error) });
    return NextResponse.json({ ok: true, data: await adminUpdateSettings(parsed.data) });
  });
}
