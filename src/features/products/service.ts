import type { QueryFilter } from "mongoose";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { Category } from "@/features/categories/model";
import { Product, type IProduct } from "./model";
import type { ProductListQuery } from "./schema";
import type { FilterOptions, ProductDTO, ProductListResult } from "./types";

type LeanProduct = IProduct & { _id: unknown };
type CategoryMap = Map<string, { id: string; name: string; slug: string }>;

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function activeCategoryMap(): Promise<CategoryMap> {
  const cats = await Category.find({ isActive: true }).lean();
  return new Map(
    cats.map((c) => [
      String(c._id),
      { id: String(c._id), name: c.name, slug: c.slug },
    ]),
  );
}

function toDTO(p: LeanProduct, cats: CategoryMap): ProductDTO {
  return {
    id: String(p._id),
    code: p.code,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    salePrice: p.salePrice ?? undefined,
    images: p.images,
    category: cats.get(String(p.categoryId)) ?? null,
    flowerType: p.flowerType,
    occasion: p.occasion,
    availability: p.availability,
    isFeatured: p.isFeatured,
    createdAt: p.createdAt.toISOString(),
  };
}

/** Điều kiện nền cho guest: sản phẩm đang hiển thị và thuộc danh mục đang hoạt động. */
function baseFilter(cats: CategoryMap): QueryFilter<IProduct> {
  return { isActive: true, categoryId: { $in: [...cats.keys()] } };
}

export async function listProducts(
  query: ProductListQuery,
): Promise<ProductListResult> {
  await connectDB();
  const cats = await activeCategoryMap();
  const filter: QueryFilter<IProduct> = baseFilter(cats);

  if (query.category) {
    const match = [...cats.values()].find((c) => c.slug === query.category);
    // Slug không tồn tại -> kết quả rỗng
    filter.categoryId = match ? match.id : { $in: [] };
  }
  if (query.q) filter.name = { $regex: escapeRegex(query.q), $options: "i" };
  if (query.flowerType) filter.flowerType = query.flowerType; // khớp phần tử trong mảng
  if (query.occasion) filter.occasion = query.occasion;
  if (query.inStock) filter.availability = "IN_STOCK";

  let { minPrice, maxPrice } = query;
  if (minPrice != null && maxPrice != null && minPrice > maxPrice)
    [minPrice, maxPrice] = [maxPrice, minPrice];
  // Lọc theo giá hiệu lực (salePrice nếu có, ngược lại price)
  const effective = { $ifNull: ["$salePrice", "$price"] };
  const priceExpr: object[] = [];
  if (minPrice != null) priceExpr.push({ $gte: [effective, minPrice] });
  if (maxPrice != null) priceExpr.push({ $lte: [effective, maxPrice] });
  if (priceExpr.length) filter.$expr = { $and: priceExpr };

  const sort: Record<string, 1 | -1> =
    query.sort === "price_asc"
      ? { price: 1, _id: 1 }
      : query.sort === "price_desc"
        ? { price: -1, _id: 1 }
        : { createdAt: -1, _id: 1 };

  const skip = (query.page - 1) * query.pageSize;
  const [docs, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(query.pageSize).lean(),
    Product.countDocuments(filter),
  ]);

  return {
    items: docs.map((d) => toDTO(d as LeanProduct, cats)),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDTO | null> {
  await connectDB();
  const cats = await activeCategoryMap();
  const doc = await Product.findOne({
    ...baseFilter(cats),
    slug: String(slug).toLowerCase(),
  }).lean();
  return doc ? toDTO(doc as LeanProduct, cats) : null;
}

export async function getProductById(id: string): Promise<ProductDTO | null> {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const cats = await activeCategoryMap();
  const doc = await Product.findOne({ ...baseFilter(cats), _id: id }).lean();
  return doc ? toDTO(doc as LeanProduct, cats) : null;
}

export async function getFeaturedProducts(limit = 8): Promise<ProductDTO[]> {
  await connectDB();
  const cats = await activeCategoryMap();
  const docs = await Product.find({ ...baseFilter(cats), isFeatured: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map((d) => toDTO(d as LeanProduct, cats));
}

export async function getLatestProducts(limit = 8): Promise<ProductDTO[]> {
  await connectDB();
  const cats = await activeCategoryMap();
  const docs = await Product.find(baseFilter(cats))
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map((d) => toDTO(d as LeanProduct, cats));
}

export async function getRelatedProducts(
  product: ProductDTO,
  limit = 4,
): Promise<ProductDTO[]> {
  if (!product.category) return [];
  await connectDB();
  const cats = await activeCategoryMap();
  const docs = await Product.find({
    ...baseFilter(cats),
    categoryId: product.category.id,
    _id: { $ne: product.id },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map((d) => toDTO(d as LeanProduct, cats));
}

/** Tùy chọn cho bộ lọc: lấy từ dữ liệu thật thay vì hardcode. */
export async function getFilterOptions(): Promise<FilterOptions> {
  await connectDB();
  const cats = await activeCategoryMap();
  const base = baseFilter(cats);
  const [flowerTypes, occasions, top] = await Promise.all([
    Product.distinct("flowerType", base),
    Product.distinct("occasion", base),
    Product.findOne(base).sort({ price: -1 }).select("price").lean(),
  ]);
  const collator = new Intl.Collator("vi");
  return {
    flowerTypes: (flowerTypes as string[]).sort(collator.compare),
    occasions: (occasions as string[]).sort(collator.compare),
    maxPrice: top?.price ?? 0,
  };
}
