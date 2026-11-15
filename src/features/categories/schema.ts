import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Tên danh mục là bắt buộc").max(100),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().default(true),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const categoryPatchSchema = z.object({ isActive: z.boolean() });

export const adminCategoryQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});
