import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url("URL không hợp lệ")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const storeSettingsInputSchema = z.object({
  storeName: z.string().trim().min(1, "Tên cửa hàng là bắt buộc").max(120),
  logo: z.string().trim().default(""),
  phone: z.string().trim().regex(/^[0-9+\-\s().]{8,20}$/, "Số điện thoại không hợp lệ"),
  email: z.string().trim().email("Email không hợp lệ"),
  address: z.string().trim().min(1, "Địa chỉ là bắt buộc").max(300),
  zaloUrl: optionalUrl,
  messengerUrl: optionalUrl,
  facebookUrl: optionalUrl,
});
export type StoreSettingsInput = z.infer<typeof storeSettingsInputSchema>;
