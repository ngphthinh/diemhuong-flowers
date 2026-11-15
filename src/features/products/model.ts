import { Schema, model, models, type Model, type Types } from "mongoose";

import { AVAILABILITY, type Availability } from "./constants";

export { AVAILABILITY, type Availability };

export interface IProduct {
  _id: Types.ObjectId;
  /** Mã sản phẩm hiển thị (vd HOA-000123). Bổ sung so với spec để phục vụ import/export và chống trùng. */
  code: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  images: string[]; // images[0] là ảnh đại diện
  categoryId: Types.ObjectId;
  flowerType: string[];
  occasion: string[];
  availability: Availability;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 1 },
    salePrice: { type: Number, min: 1 },
    images: { type: [String], required: true, validate: (v: string[]) => v.length > 0 },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    flowerType: { type: [String], default: [] },
    occasion: { type: [String], default: [] },
    availability: { type: String, enum: AVAILABILITY, default: "IN_STOCK" },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Ràng buộc giá khuyến mãi <= giá gốc (validate ở tầng Zod + model)
ProductSchema.pre("validate", function () {
  if (this.salePrice != null && this.salePrice > this.price) {
    this.invalidate("salePrice", "salePrice must not exceed price");
  }
});

// Indexes (slug và code đã unique ở field-level)
ProductSchema.index({ name: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ availability: 1 });
ProductSchema.index({ createdAt: -1 });
// Index tổng hợp cho trang danh sách guest
ProductSchema.index({ isActive: 1, createdAt: -1 });
ProductSchema.index({ isActive: 1, price: 1 });
ProductSchema.index({ isActive: 1, isFeatured: 1, createdAt: -1 });

export const Product: Model<IProduct> =
  (models.Product as Model<IProduct>) || model<IProduct>("Product", ProductSchema, "products");

export function formatProductCode(seq: number): string {
  return `HOA-${String(seq).padStart(6, "0")}`;
}
