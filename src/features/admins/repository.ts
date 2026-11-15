import { connectDB } from "@/lib/db/mongoose";
import { Admin } from "./model";

export async function findAdminByEmailWithPassword(email: string) {
  await connectDB();
  // password có select:false nên phải chọn tường minh. email được ép về string để tránh NoSQL injection.
  return Admin.findOne({ email: String(email).toLowerCase() }).select("+password").lean();
}
