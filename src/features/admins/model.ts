import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IAdmin {
  _id: Types.ObjectId;
  email: string;
  password: string; // bcrypt hash — KHÔNG BAO GIỜ lưu plain text
  fullName: string;
  role: "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false }, // mặc định không trả về khi query
    fullName: { type: String, required: true, trim: true },
    role: { type: String, enum: ["ADMIN"], default: "ADMIN", required: true },
  },
  { timestamps: true },
);

export const Admin: Model<IAdmin> =
  (models.Admin as Model<IAdmin>) || model<IAdmin>("Admin", AdminSchema, "admins");
