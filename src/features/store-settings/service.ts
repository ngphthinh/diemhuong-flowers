import { connectDB } from "@/lib/db/mongoose";
import { StoreSettings } from "./model";

export interface StoreSettingsDTO {
  storeName: string;
  logo: string;
  phone: string;
  email: string;
  address: string;
  zaloUrl?: string;
  messengerUrl?: string;
  facebookUrl?: string;
}

/** Giá trị mặc định khi Admin chưa cấu hình (chỉ có tên thương hiệu, các kênh liên hệ để trống và sẽ được ẩn). */
const DEFAULTS: StoreSettingsDTO = {
  storeName: "Anniversary Flower Shop",
  logo: "",
  phone: "",
  email: "",
  address: "",
};

export async function getStoreSettings(): Promise<StoreSettingsDTO> {
  await connectDB();
  const doc = await StoreSettings.findOne().lean();
  if (!doc) return DEFAULTS;
  return {
    storeName: doc.storeName,
    logo: doc.logo ?? "",
    phone: doc.phone,
    email: doc.email,
    address: doc.address,
    zaloUrl: doc.zaloUrl || undefined,
    messengerUrl: doc.messengerUrl || undefined,
    facebookUrl: doc.facebookUrl || undefined,
  };
}
