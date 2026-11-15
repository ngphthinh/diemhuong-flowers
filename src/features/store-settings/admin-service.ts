import "server-only";
import { connectDB } from "@/lib/db/mongoose";
import { StoreSettings, type IStoreSettings } from "./model";
import type { StoreSettingsInput } from "./schema";

export interface AdminSettingsDTO {
  storeName: string;
  logo: string;
  phone: string;
  email: string;
  address: string;
  zaloUrl: string;
  messengerUrl: string;
  facebookUrl: string;
  updatedAt: string;
}

const toDTO = (s: IStoreSettings): AdminSettingsDTO => ({
  storeName: s.storeName,
  logo: s.logo ?? "",
  phone: s.phone,
  email: s.email,
  address: s.address,
  zaloUrl: s.zaloUrl ?? "",
  messengerUrl: s.messengerUrl ?? "",
  facebookUrl: s.facebookUrl ?? "",
  updatedAt: (s.updatedAt ?? new Date()).toISOString(),
});

/** Chưa cấu hình: trả mặc định để form admin vẫn mở được. */
const EMPTY: AdminSettingsDTO = {
  storeName: "Anniversary Flower Shop",
  logo: "",
  phone: "",
  email: "",
  address: "",
  zaloUrl: "",
  messengerUrl: "",
  facebookUrl: "",
  updatedAt: new Date(0).toISOString(),
};

export async function adminGetSettings(): Promise<AdminSettingsDTO> {
  await connectDB();
  const doc = await StoreSettings.findOne().lean();
  return doc ? toDTO(doc) : EMPTY;
}

export async function adminUpdateSettings(input: StoreSettingsInput): Promise<AdminSettingsDTO> {
  await connectDB();
  const doc = await StoreSettings.findOneAndUpdate(
    {},
    {
      $set: {
        storeName: input.storeName,
        logo: input.logo ?? "",
        phone: input.phone,
        email: input.email,
        address: input.address,
        zaloUrl: input.zaloUrl ?? "",
        messengerUrl: input.messengerUrl ?? "",
        facebookUrl: input.facebookUrl ?? "",
      },
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();
  return toDTO(doc!);
}
