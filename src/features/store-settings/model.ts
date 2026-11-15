import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IStoreSettings {
  _id: Types.ObjectId;
  storeName: string;
  logo: string;
  phone: string;
  email: string;
  address: string;
  zaloUrl?: string;
  messengerUrl?: string;
  facebookUrl?: string;
  updatedAt: Date;
}

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    storeName: { type: String, required: true, trim: true },
    logo: { type: String, default: "" },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    zaloUrl: { type: String, trim: true },
    messengerUrl: { type: String, trim: true },
    facebookUrl: { type: String, trim: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export const StoreSettings: Model<IStoreSettings> =
  (models.StoreSettings as Model<IStoreSettings>) ||
  model<IStoreSettings>("StoreSettings", StoreSettingsSchema, "store_settings");
