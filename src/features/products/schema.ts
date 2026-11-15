import { z } from "zod";
import { AVAILABILITY } from "./constants";


/** Ảnh hợp lệ: URL https (Cloudinary/placehold) hoặc đường dẫn nội bộ /uploads/... (upload local khi dev, chưa cấu hình Cloudinary). */
export const imageRef = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^\/uploads\/[\w.-]+$/.test(v) || /^https:\/\/[^\s]+$/.test(v), "Đường dẫn ảnh không hợp lệ");

const productBase = z.object({
  name: z.string().trim().min(1, "Tên sản phẩm là bắt buộc").max(200),
  description: z.string().trim().min(1, "Mô tả là bắt buộc").max(5000),
  price: z.coerce.number({ error: "Vui lòng nhập giá" }).positive("Giá phải lớn hơn 0"),
  salePrice: z.coerce.number({ error: "Giá khuyến mãi không hợp lệ" }).positive("Giá khuyến mãi phải lớn hơn 0").optional(),
  images: z.array(imageRef).min(1, "Phải có ít nhất một ảnh").max(10),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i, "Vui lòng chọn danh mục"),
  flowerType: z.array(z.string().trim().min(1)).default([]),
  occasion: z.array(z.string().trim().min(1)).default([]),
  availability: z.enum(AVAILABILITY).default("IN_STOCK"),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

const salePriceRule = (v: { price: number; salePrice?: number }) =>
  v.salePrice == null || v.salePrice <= v.price;
const salePriceMsg = { message: "Giá khuyến mãi không được lớn hơn giá gốc", path: ["salePrice"] };

export const productInputSchema = productBase.refine(salePriceRule, salePriceMsg);
export const productUpdateSchema = productBase.refine(salePriceRule, salePriceMsg);
export type ProductInput = z.infer<typeof productInputSchema>;

/** Query cho GET /api/products (guest) — dùng ở Phase 2 */
export const productListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().optional(), // slug
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  flowerType: z.string().trim().optional(),
  occasion: z.string().trim().optional(),
  // Lưu ý: z.coerce.boolean() coi chuỗi "false" là true, nên parse thủ công
  inStock: z
    .enum(["1", "true", "0", "false"])
    .optional()
    .transform((v) => v === "1" || v === "true"),
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});
export type ProductListQuery = z.infer<typeof productListQuerySchema>;

/** Query cho trang quản trị sản phẩm. */
export const adminProductQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().regex(/^[a-f\d]{24}$/i).optional(), // id danh mục
  status: z.enum(["active", "hidden", "in_stock", "out_of_stock"]).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sort: z.enum(["newest", "oldest", "price_asc", "price_desc", "name"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});
export type AdminProductQuery = z.infer<typeof adminProductQuerySchema>;
