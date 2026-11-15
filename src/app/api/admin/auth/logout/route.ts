import { NextResponse, connection } from "next/server";
import { destroySession } from "@/lib/auth/session";

export async function POST() {
  await connection();
  await destroySession();
  return NextResponse.json({ ok: true });
}
