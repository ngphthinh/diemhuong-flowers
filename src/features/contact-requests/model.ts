import { Schema, model, models, type Model, type Types } from "mongoose";

import { CONTACT_STATUS, type ContactStatus } from "./constants";

export { CONTACT_STATUS, type ContactStatus };

export interface IContactRequest {
  _id: Types.ObjectId;
  customerName: string;
  phone: string;
  email?: string;
  productId?: Types.ObjectId;
  message: string;
  status: ContactStatus;
  createdAt: Date;
}

const ContactRequestSchema = new Schema<IContactRequest>(
  {
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: CONTACT_STATUS, default: "PENDING" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ContactRequestSchema.index({ status: 1, createdAt: -1 });
ContactRequestSchema.index({ productId: 1 });

export const ContactRequest: Model<IContactRequest> =
  (models.ContactRequest as Model<IContactRequest>) ||
  model<IContactRequest>("ContactRequest", ContactRequestSchema, "contact_requests");
