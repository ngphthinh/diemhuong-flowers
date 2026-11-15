import "server-only";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { ConflictError, isDuplicateKeyError } from "@/lib/errors";
import { foldVi, slugify } from "@/lib/utils";
import { Product } from "@/features/products/model";
import { Category, type ICategory } from "./model";

export interface AdminCategoryDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

type CategoryInput = { name: string; description?: string; isActive: boolean };
type LeanCategory = ICategory & { _id: unknown };

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function toDTO(c: LeanCategory, productCount: number): AdminCategoryDTO {
  return {
    id: String(c._id),
    name: c.name,
    slug: c.slug,
    description: c.description || undefined,
    isActive: c.isActive,
    productCount,
    createdAt: c.createdAt.toISOString(),
  };
}

async function productCount(id: string): Promise<number> {
  return Product.countDocuments({ categoryId: id });
}

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || "danh-muc";
  let slug = root;
  let n = 2;
  while (await Category.exists({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) })) slug = `${root}-${n++}`;
  return slug;
}

/** Tên danh mục không phân biệt hoa/thường. */
async function nameTaken(name: string, ignoreId?: string): Promise<boolean> {
  const filter = { name: new RegExp(`^${escapeRegex(name.trim())}$`, "i"), ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) };
  return !!(await Category.exists(filter));
}

export async function adminListCategories(q: { q?: string; status?: "active" | "inactive" } = {}): Promise<AdminCategoryDTO[]> {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (q.status) filter.isActive = q.status === "active";
  const [docs, counts] = await Promise.all([
    Category.find(filter).lean(),
    Product.aggregate<{ _id: unknown; n: number }>([{ $group: { _id: "$categoryId", n: { $sum: 1 } } }]),
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.n]));
  let list = docs as LeanCategory[];
  if (q.q) {
    const needle = foldVi(q.q);
    list = list.filter((c) => foldVi(c.name).includes(needle));
  }
  return list
    .sort((a, b) => a.name.localeCompare(b.name, "vi"))
    .map((c) => toDTO(c, countMap.get(String(c._id)) ?? 0));
}

export async function adminCreateCategory(input: CategoryInput): Promise<AdminCategoryDTO> {
  await connectDB();
  if (await nameTaken(input.name)) throw new ConflictError("Tên danh mục đã tồn tại", "name");
  try {
    const doc = await Category.create({
      name: input.name,
      slug: await uniqueSlug(input.name),
      description: input.description || undefined,
      isActive: input.isActive,
    });
    return toDTO(doc.toObject() as LeanCategory, 0);
  } catch (e) {
    if (isDuplicateKeyError(e)) throw new ConflictError("Tên danh mục đã tồn tại", "name");
    throw e;
  }
}

export async function adminUpdateCategory(id: string, input: CategoryInput): Promise<AdminCategoryDTO | null> {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const doc = await Category.findById(id);
  if (!doc) return null;
  if (await nameTaken(input.name, id)) throw new ConflictError("Tên danh mục đã tồn tại", "name");
  if (doc.name !== input.name) doc.slug = await uniqueSlug(input.name, id);
  doc.name = input.name;
  doc.description = input.description || undefined;
  doc.isActive = input.isActive;
  try {
    await doc.save();
  } catch (e) {
    if (isDuplicateKeyError(e)) throw new ConflictError("Tên danh mục đã tồn tại", "name");
    throw e;
  }
  return toDTO(doc.toObject() as LeanCategory, await productCount(id));
}

export async function adminSetCategoryActive(id: string, isActive: boolean): Promise<AdminCategoryDTO | null> {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const doc = await Category.findByIdAndUpdate(id, { $set: { isActive } }, { new: true }).lean();
  return doc ? toDTO(doc as LeanCategory, await productCount(id)) : null;
}

/** Chặn xóa khi còn sản phẩm dùng danh mục. */
export async function adminDeleteCategory(id: string): Promise<{ result: "ok" | "not_found" } | { result: "in_use"; productCount: number }> {
  if (!isValidObjectId(id)) return { result: "not_found" };
  await connectDB();
  if (!(await Category.exists({ _id: id }))) return { result: "not_found" };
  const count = await productCount(id);
  if (count > 0) return { result: "in_use", productCount: count };
  await Category.deleteOne({ _id: id });
  return { result: "ok" };
}
