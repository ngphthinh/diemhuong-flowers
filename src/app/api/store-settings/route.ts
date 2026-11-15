import { NextResponse, connection } from "next/server";
import { getStoreSettings } from "@/features/store-settings/service";
import { serverError } from "@/lib/api";

export async function GET() {
  await connection();
  try {
    return NextResponse.json({ ok: true, data: await getStoreSettings() });
  } catch (err) {
    return serverError("GET /api/store-settings", err);
  }
}
