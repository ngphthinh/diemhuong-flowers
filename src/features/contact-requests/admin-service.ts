import "server-only";
import type { QueryFilter } from "mongoose";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { foldVi } from "@/lib/utils";
import { Product } from "@/features/products/model";
import type { ContactStatus } from "./constants";
import { ContactRequest, type IContactRequest } from "./model";
import type { AdminContactQuery } from "./schema";

export interface AdminContactDTO {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  product: { id: string; name: string; code: string } | null;
  message: string;
  status: ContactStatus;
  createdAt: string;
}

export interface AdminContactList {
  items: AdminContactDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type LeanContact = IContactRequest & { _id: unknown };
type ProductRef = { id: string; name: string; code: string };

function toDTO(c: LeanContact, products: Map<string, ProductRef>): AdminContactDTO {
  return {
    id: String(c._id),
    customerName: c.customerName,
    phone: c.phone,
    email: c.email || undefined,
    product: c.productId ? (products.get(String(c.productId)) ?? null) : null,
    message: c.message,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  };
}

async function productRefs(contacts: LeanContact[]): Promise<Map<string, ProductRef>> {
  const ids = [...new Set(contacts.map((c) => c.productId).filter(Boolean).map(String))];
  if (ids.length === 0) return new Map();
  const docs = await Product.find({ _id: { $in: ids } }).select("name code").lean();
  return new Map(docs.map((p) => [String(p._id), { id: String(p._id), name: p.name, code: p.code }]));
}

export async function adminListContacts(q: AdminContactQuery): Promise<AdminContactList> {
  await connectDB();
  const filter: QueryFilter<IContactRequest> = {};
  if (q.status) filter.status = q.status;

  if (q.q) {
    const needle = foldVi(q.q);
    const digits = q.q.replace(/\D/g, "");
    const rows = await ContactRequest.find(filter).select("customerName phone email message").lean();
    const ids = rows
      .filter((c) =>
        foldVi(c.customerName).includes(needle) ||
        (digits !== "" && c.phone.replace(/\D/g, "").includes(digits)) ||
        foldVi(c.email ?? "").includes(needle) ||
        foldVi(c.message).includes(needle))
      .map((c) => c._id);
    filter._id = { $in: ids };
  }

  const skip = (q.page - 1) * q.pageSize;
  const [docs, total] = await Promise.all([
    ContactRequest.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(q.pageSize).lean(),
    ContactRequest.countDocuments(filter),
  ]);
  const list = docs as LeanContact[];
  const refs = await productRefs(list);
  return {
    items: list.map((c) => toDTO(c, refs)),
    total,
    page: q.page,
    pageSize: q.pageSize,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
  };
}

export async function adminGetContact(id: string): Promise<AdminContactDTO | null> {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const doc = (await ContactRequest.findById(id).lean()) as LeanContact | null;
  return doc ? toDTO(doc, await productRefs([doc])) : null;
}

export async function adminSetContactStatus(id: string, status: ContactStatus): Promise<AdminContactDTO | null> {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const doc = (await ContactRequest.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean()) as LeanContact | null;
  return doc ? toDTO(doc, await productRefs([doc])) : null;
}

export async function adminDeleteContact(id: string): Promise<boolean> {
  if (!isValidObjectId(id)) return false;
  await connectDB();
  const res = await ContactRequest.deleteOne({ _id: id });
  return res.deletedCount > 0;
}
