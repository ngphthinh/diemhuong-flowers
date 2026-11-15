import { z } from "zod";

/**
 * Validate biến môi trường (chỉ dùng ở server).
 * Parse lazy để `next build` không lỗi khi chưa có .env.
 */
const serverSchema = z.object({
  // Tùy chọn để `next build` không lỗi khi chưa có .env; connectDB() sẽ báo lỗi rõ ràng nếu thiếu lúc chạy.
  MONGODB_URI: z.string().min(1).optional(),
  MONGODB_DB: z.string().min(1).default("flower_shop"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 chars").optional(),
  AUTH_URL: z.string().url().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  ADMIN_NOTIFY_EMAIL: z.string().email().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment variables -> ${msg}`);
  }
  cached = parsed.data;
  return cached;
}
