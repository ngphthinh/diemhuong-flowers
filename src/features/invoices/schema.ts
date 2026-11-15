import { z } from "zod";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "./constants";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const invoiceItemInputSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i, "Sản phẩm không hợp lệ"),
  quantity: z.coerce
    .number({ error: "Số lượng không hợp lệ" })
    .int("Số lượng phải là số nguyên")
    .min(1, "Số lượng tối thiểu là 1")
    .max(999),
  /** Không gửi = lấy giá hiện hành (giá KM nếu có) từ DB. Có gửi = admin chủ động đổi giá cho hóa đơn này. */
  unitPrice: z.coerce
    .number({ error: "Đơn giá không hợp lệ" })
    .int("Đơn giá phải là số nguyên")
    .min(0, "Đơn giá không được âm")
    .optional(),
});

export const invoiceInputSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên khách hàng")
    .max(100),
  customerPhone: optionalText(20).refine(
    (v) => !v || /^[0-9+\s.()-]{6,20}$/.test(v),
    "Số điện thoại không hợp lệ",
  ),
  customerAddress: optionalText(300),
  note: optionalText(500),
  paymentMethod: z.enum(PAYMENT_METHODS).default("CASH"),
  paymentStatus: z.enum(PAYMENT_STATUSES).default("PAID"),
  discount: z.coerce
    .number({ error: "Giảm giá không hợp lệ" })
    .int("Giảm giá phải là số nguyên")
    .min(0, "Giảm giá không được âm")
    .default(0),
  items: z
    .array(invoiceItemInputSchema)
    .min(1, "Hóa đơn cần ít nhất một sản phẩm")
    .max(50, "Tối đa 50 dòng sản phẩm"),
});
export type InvoiceInput = z.infer<typeof invoiceInputSchema>;

export const adminInvoiceQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(15),
});
export type AdminInvoiceQuery = z.infer<typeof adminInvoiceQuerySchema>;
