import "./load-env";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db/mongoose";
import { Admin } from "../src/features/admins/model";
import { adminSeedSchema } from "../src/features/admins/schema";

/**
 * Seed Admin ban đầu từ biến môi trường:
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME
 * - Nếu email đã tồn tại: bỏ qua (không ghi đè).
 * - Thêm cờ --reset-password để đặt lại mật khẩu của admin đã tồn tại.
 * Mật khẩu KHÔNG được hardcode trong code, và chỉ lưu dưới dạng bcrypt hash.
 */
async function main() {
  const parsed = adminSeedSchema.safeParse({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    fullName: process.env.ADMIN_FULL_NAME ?? "Administrator",
  });
  if (!parsed.success) {
    console.error("❌ Biến môi trường admin không hợp lệ:");
    for (const i of parsed.error.issues) console.error(` - ${i.path.join(".")}: ${i.message}`);
    process.exitCode = 1;
    return;
  }
  const { email, password, fullName } = parsed.data;
  const reset = process.argv.includes("--reset-password");

  await connectDB();
  const existing = await Admin.findOne({ email }).select("+password");
  const hash = await bcrypt.hash(password, 12);

  if (existing) {
    if (!reset) {
      console.log(`ℹ️  Admin ${email} đã tồn tại — bỏ qua (dùng --reset-password để đổi mật khẩu).`);
      return;
    }
    existing.password = hash;
    existing.fullName = fullName;
    await existing.save();
    console.log(`🔑 Đã đặt lại mật khẩu cho ${email}`);
    return;
  }

  await Admin.create({ email, password: hash, fullName, role: "ADMIN" });
  console.log(`✅ Đã tạo admin: ${email}`);
}

main()
  .catch((e) => {
    console.error("❌ Lỗi:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
