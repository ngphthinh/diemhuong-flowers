import { SignJWT, jwtVerify } from "jose";

export interface SessionPayload {
  sub: string;
  email: string;
  fullName: string;
  role: "ADMIN";
}

const DEV_FALLBACK_SECRET = "dev-only-insecure-secret-change-me-please-0123456789";

function secretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET phải có ít nhất 16 ký tự (tạo bằng: openssl rand -base64 32)");
    return new TextEncoder().encode(DEV_FALLBACK_SECRET); // chỉ dành cho local dev
  }
  return new TextEncoder().encode(s);
}

/** Tên cookie: tiền tố __Host- (bắt buộc Secure + path=/) khi chạy production. */
export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-fs_session" : "fs_session";

export async function signSession(payload: SessionPayload, ttlSeconds: number): Promise<string> {
  return new SignJWT({ email: payload.email, fullName: payload.fullName, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.role !== "ADMIN" || typeof payload.sub !== "string") return null;
    return { sub: payload.sub, email: String(payload.email), fullName: String(payload.fullName), role: "ADMIN" };
  } catch {
    return null;
  }
}
