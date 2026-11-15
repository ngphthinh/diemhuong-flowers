import { z } from "zod";
import { CONTACT_STATUS } from "./constants";

export const contactRequestInputSchema = z.object({
  customerName: z.string().trim().min(2, "Vui lòng nhập họ tên").max(100),
  phone: z.string().trim().regex(/^(\+?84|0)[0-9\s.\-]{8,14}$/, "Số điện thoại không hợp lệ"),
  email: z.string().trim().email("Email không hợp lệ").optional().or(z.literal("").transform(() => undefined)),
  productId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  message: z.string().trim().min(5, "Lời nhắn quá ngắn").max(2000),
  // Honeypot chống bot: người thật để trống. Không chặn ở schema; route sẽ im lặng bỏ qua nếu ô này có giá trị.
  website: z.string().max(200).optional(),
});
export type ContactRequestInput = z.infer<typeof contactRequestInputSchema>;

export const contactStatusUpdateSchema = z.object({ status: z.enum(CONTACT_STATUS) });

export const adminContactQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(CONTACT_STATUS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});
export type AdminContactQuery = z.infer<typeof adminContactQuerySchema>;
