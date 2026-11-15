import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, signSession, verifySession, type SessionPayload } from "./token";

const SHORT_TTL = 60 * 60 * 12; // 12 giờ (cookie phiên — mất khi đóng trình duyệt)
const REMEMBER_TTL = 60 * 60 * 24 * 7; // 7 ngày

export async function createSession(payload: SessionPayload, remember: boolean): Promise<void> {
  const ttl = remember ? REMEMBER_TTL : SHORT_TTL;
  const token = await signSession(payload, ttl);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(remember ? { maxAge: REMEMBER_TTL } : {}),
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getSession(): Promise<SessionPayload | null> {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}
