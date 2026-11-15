import "server-only";
import bcrypt from "bcryptjs";
import { findAdminByEmailWithPassword } from "./repository";

export interface AuthedAdmin {
  id: string;
  email: string;
  fullName: string;
}

// Hash dùng khi email không tồn tại, để thời gian phản hồi không lộ email nào có thật.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

export async function verifyAdminCredentials(email: string, password: string): Promise<AuthedAdmin | null> {
  const normalized = email.trim().toLowerCase();


  const admin = await findAdminByEmailWithPassword(normalized);
  const ok = await bcrypt.compare(password, admin?.password ?? DUMMY_HASH);
  if (!admin || !ok || admin.role !== "ADMIN") return null;
  return { id: String(admin._id), email: admin.email, fullName: admin.fullName };
}
