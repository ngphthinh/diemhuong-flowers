import "server-only";
import type { QueryFilter } from "mongoose";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { ConflictError, isDuplicateKeyError } from "@/lib/errors";
import { foldVi, slugify } from "@/lib/utils";
import { Category } from "@/features/categories/model";
import { ContactRequest } from "@/features/contact-requests/model";
import type { AdminProductDTO, AdminProductList } from "./admin-types";
import { Product, type IProduct } from "./model";
import { generateProductCode } from "./repository";
import type { AdminProductQuery, ProductInput } from "./schema";

type LeanProduct = IProduct & { _id: unknown };
type ProductWrite = Omit<ProductInput, "salePrice"> & { salePrice?: number | null };

function toDTO(p: LeanProduct, categoryNames: Map<string, string>): AdminProductDTO {
  return {
    id: String(p._id),
    code: p.code,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    salePrice: p.salePrice ?? undefined,
    images: p.images,
    categoryId: String(p.categoryId),
    categoryName: categoryNames.get(String(p.categoryId)) ?? "(đã xóa)",
    flowerType: p.flowerType,
    occasion: p.occasion,
    availability: p.availability,
    isFeatured: p.isFeatured,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

async function categoryNameMap(): Promise<Map<string, string>> {
  const cats = await Category.find().select("name").lean();
  return new Map(cats.map((c) => [String(c._id), c.name]));
}

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || "san-pham";
  let slug = root;
  let n = 2;
  while (await Product.exists({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) })) slug = `${root}-${n++}`;
  return slug;
}

async function assertCategoryExists(categoryId: string) {
  if (!isValidObjectId(categoryId) || !(await Category.exists({ _id: categoryId }))) {
    throw new ConflictError("Danh mục không tồn tại", "categoryId");
  }
}

export async function adminListProducts(q: AdminProductQuery): Promise<AdminProductList> {
  await connectDB();
  const filter: QueryFilter<IProduct> = {};
  if (q.category) filter.categoryId = q.category;
  if (q.status === "active") filter.isActive = true;
  if (q.status === "hidden") filter.isActive = false;
  if (q.status === "in_stock") filter.availability = "IN_STOCK";
  if (q.status === "out_of_stock") filter.availability = "OUT_OF_STOCK";

  let { minPrice, maxPrice } = q;
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];
  const effective = { $ifNull: ["$salePrice", "$price"] };
  const priceExpr: object[] = [];
  if (minPrice != null) priceExpr.push({ $gte: [effective, minPrice] });
  if (maxPrice != null) priceExpr.push({ $lte: [effective, maxPrice] });
  if (priceExpr.length) filter.$expr = { $and: priceExpr };

  // Tìm kiếm không phân biệt dấu: lọc ở server ứng dụng trên (name, code) rồi mới phân trang.
  if (q.q) {
    const needle = foldVi(q.q);
    const codeNeedle = q.q.toLowerCase();
    const rows = await Product.find(filter).select("name code").lean();
    const ids = rows.filter((p) => foldVi(p.name).includes(needle) || p.code.toLowerCase().includes(codeNeedle)).map((p) => p._id);
    filter._id = { $in: ids };
  }

  const sort: Record<string, 1 | -1> =
    q.sort === "oldest" ? { createdAt: 1, _id: 1 }
    : q.sort === "price_asc" ? { price: 1, _id: 1 }
    : q.sort === "price_desc" ? { price: -1, _id: 1 }
    : q.sort === "name" ? { name: 1, _id: 1 }
    : { createdAt: -1, _id: 1 };

  const skip = (q.page - 1) * q.pageSize;
  const [docs, total, names] = await Promise.all([
    Product.find(filter).sort(sort).collation({ locale: "vi" }).skip(skip).limit(q.pageSize).lean(),
    Product.countDocuments(filter),
    categoryNameMap(),
  ]);
  return {
    items: docs.map((d) => toDTO(d as LeanProduct, names)),
    total,
    page: q.page,
    pageSize: q.pageSize,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
  };
}

/** Toàn bộ sản phẩm (dùng cho đối chiếu khi import Excel). */
export async function adminListAllProducts(): Promise<AdminProductDTO[]> {
  await connectDB();
  const [docs, names] = await Promise.all([Product.find().sort({ createdAt: 1, _id: 1 }).lean(), categoryNameMap()]);
  return docs.map((d) => toDTO(d as LeanProduct, names));
}

export async function adminGetProduct(id: string): Promise<AdminProductDTO | null> {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const [doc, names] = await Promise.all([Product.findById(id).lean(), categoryNameMap()]);
  return doc ? toDTO(doc as LeanProduct, names) : null;
}

export async function adminCreateProduct(input: ProductWrite): Promise<AdminProductDTO> {
  await connectDB();
  await assertCategoryExists(input.categoryId);
  // Thử lại vài lần nếu trùng slug do hai request tạo cùng tên một lúc
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const doc = await Product.create({
        ...input,
        salePrice: input.salePrice ?? undefined,
        code: await generateProductCode(),
        slug: await uniqueSlug(input.name),
      });
      return toDTO(doc.toObject() as LeanProduct, await categoryNameMap());
    } catch (e) {
      if (!isDuplicateKeyError(e) || attempt === 3) throw e;
    }
  }
  throw new Error("unreachable");
}

export async function adminUpdateProduct(id: string, input: ProductWrite): Promise<AdminProductDTO | null> {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const doc = await Product.findById(id);
  if (!doc) return null;
  await assertCategoryExists(input.categoryId);
  if (doc.name !== input.name) doc.slug = await uniqueSlug(input.name, id);
  doc.set({ ...input, salePrice: input.salePrice ?? undefined });
  await doc.save();
  return toDTO(doc.toObject() as LeanProduct, await categoryNameMap());
}

export async function adminDeleteProduct(id: string): Promise<boolean> {
  if (!isValidObjectId(id)) return false;
  await connectDB();
  const res = await Product.deleteOne({ _id: id });
  if (res.deletedCount === 0) return false;
  // Giữ yêu cầu liên hệ nhưng bỏ tham chiếu tới sản phẩm đã xóa
  await ContactRequest.updateMany({ productId: id }, { $unset: { productId: 1 } });
  return true;
}
