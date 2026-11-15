import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import {
  ProductFilters,
  SortSelect,
} from "@/components/products/product-filters";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductGridSkeleton } from "@/components/products/product-card";
import { Pagination } from "@/components/products/pagination";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { listActiveCategories } from "@/features/categories/service";
import { productListQuerySchema } from "@/features/products/schema";
import { getFilterOptions, listProducts } from "@/features/products/service";

export const metadata: Metadata = {
  title: "Sản phẩm",
  description:
    "Danh sách hoa sinh nhật, hoa kỷ niệm, hoa tình yêu và hoa sự kiện. Lọc theo danh mục, giá, loại hoa và dịp tặng.",
};

type SP = Promise<Record<string, string | string[] | undefined>>;

export default function ProductsPage({ searchParams }: { searchParams: SP }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-semibold sm:text-5xl">Sản phẩm</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Chọn mẫu hoa phù hợp, rồi gửi yêu cầu để cửa hàng tư vấn và chốt đơn.
      </p>
      <Suspense fallback={<ListSkeleton />}>
        <Listing searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[18rem_1fr]">
      <Skeleton className="h-96" />
      <ProductGridSkeleton count={9} columns={3} />
    </div>
  );
}

async function Listing({ searchParams }: { searchParams: SP }) {
  await connection();
  const raw = await searchParams;
  // Mỗi tham số chỉ lấy giá trị đầu tiên; tham số sai định dạng -> dùng mặc định
  const flat = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const parsed = productListQuerySchema.safeParse(flat);
  const query = parsed.success ? parsed.data : productListQuerySchema.parse({});

  const [result, categories, options] = await Promise.all([
    listProducts(query),
    listActiveCategories(),
    getFilterOptions(),
  ]);

  const params: Record<string, string | undefined> = {
    q: query.q,
    category: query.category,
    flowerType: query.flowerType,
    occasion: query.occasion,
    minPrice: query.minPrice?.toString(),
    maxPrice: query.maxPrice?.toString(),
    inStock: query.inStock ? "1" : undefined,
    sort: query.sort === "newest" ? undefined : query.sort,
  };

  // Trang vượt quá giới hạn -> chuyển về trang cuối
  if (result.total > 0 && query.page > result.totalPages) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (result.totalPages > 1) sp.set("page", String(result.totalPages));
    redirect(`/products${sp.size ? `?${sp}` : ""}`);
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[18rem_1fr] lg:items-start">
      <aside className="lg:sticky lg:top-24">
        <ProductFilters categories={categories} options={options} />
      </aside>

      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {result.total === 0
              ? "Không có sản phẩm phù hợp"
              : `${result.total} sản phẩm`}
          </p>
          <SortSelect />
        </div>

        {result.items.length === 0 ? (
          <EmptyState
            icon={<SearchX />}
            title="Không tìm thấy sản phẩm"
            description="Thử bỏ bớt bộ lọc hoặc tìm bằng từ khóa khác. Bạn cũng có thể nhờ cửa hàng tư vấn trực tiếp."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  href="/products"
                  className={buttonVariants({ variant: "outline" })}>
                  Xóa bộ lọc
                </Link>
                <Link href="/contact" className={buttonVariants()}>
                  Nhờ cửa hàng tư vấn
                </Link>
              </div>
            }
          />
        ) : (
          <>
            <ProductGrid
              products={result.items}
              columns={3}
              priorityCount={3}
            />
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              basePath="/products"
              params={params}
            />
          </>
        )}
      </div>
    </div>
  );
}
  