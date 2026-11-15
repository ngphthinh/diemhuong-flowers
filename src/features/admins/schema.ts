import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
  remember: z.boolean().optional(),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const adminSeedSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(10, "ADMIN_PASSWORD phải có ít nhất 10 ký tự")
    .regex(/[a-z]/, "Cần chữ thường")
    .regex(/[A-Z]/, "Cần chữ hoa")
    .regex(/[0-9]/, "Cần chữ số"),
  fullName: z.string().trim().min(2),
});
