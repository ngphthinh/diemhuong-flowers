import { Schema, model, models, type Model, type Types } from "mongoose";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type PaymentMethod,
  type PaymentStatus,
} from "./constants";

export interface IInvoiceItem {
  productId: Types.ObjectId;
  /** Snapshot tại thời điểm lập hóa đơn — sửa/xóa sản phẩm sau này không làm đổi hóa đơn cũ. */
  code: string;
  name: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface IInvoice {
  _id: Types.ObjectId;
  code: string; // HD-000001
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  note?: string;
  items: IInvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdBy: string; // email admin
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, trim: true },
    customerAddress: { type: String, trim: true },
    note: { type: String, trim: true },
    items: {
      type: [InvoiceItemSchema],
      required: true,
      validate: (v: unknown[]) => v.length > 0,
    },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: "CASH" },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "PAID" },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

InvoiceSchema.index({ createdAt: -1 });
InvoiceSchema.index({ customerPhone: 1 });

export const Invoice: Model<IInvoice> =
  (models.Invoice as Model<IInvoice>) ||
  model<IInvoice>("Invoice", InvoiceSchema, "invoices");

export function formatInvoiceCode(seq: number): string {
  return `HD-${String(seq).padStart(6, "0")}`;
}
