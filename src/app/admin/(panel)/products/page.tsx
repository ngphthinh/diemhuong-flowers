import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { FileUp, Plus, PackageSearch } from "lucide-react";
import { TemplateDownloadButton } from "@/components/admin/template-download-button";
import { PageHeader } from "@/components/admin/ui";
import { ProductsTable } from "@/components/admin/products-table";
import { Pagination } from "@/components/products/pagination";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { adminListCategories } from "@/features/categories/admin-service";
import { adminListProducts } from "@/features/products/admin-service";
import { adminProductQuerySchema } from "@/features/products/schema";

export const metadata: Metadata = { title: "Sản phẩm" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default function AdminProductsPage({ searchParams }: { searchParams: SP }) {
  return (
    <>
      <PageHeader title="Sản phẩm" description="Quản lý toàn bộ sản phẩm của cửa hàng"
        actions={
          <>
            <TemplateDownloadButton />
            <Link href="/admin/products/import" className={buttonVariants({ variant: "outline" })}><FileUp /> Nhập Excel</Link>
            <Link href="/admin/products/create" className={buttonVariants()}><Plus /> Thêm sản phẩm</Link>
          </>
        } />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <List searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function List({ searchParams }: { searchParams: SP }) {
  await connection();
  const raw = await searchParams;
  const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  // Tham số sai định dạng -> bỏ qua và dùng mặc định (không văng lỗi)
  const parsed = adminProductQuerySchema.safeParse(flat);
  const query = parsed.success ? parsed.data : adminProductQuerySchema.parse({});

  const [result, categories] = await Promise.all([adminListProducts(query), adminListCategories()]);

  const params: Record<string, string | undefined> = {
    q: query.q, category: query.category, status: query.status,
    minPrice: query.minPrice?.toString(), maxPrice: query.maxPrice?.toString(),
    sort: query.sort === "newest" ? undefined : query.sort,
  };

  return (
    <>
      <ProductsTable items={result.items} total={result.total} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
      {result.items.length === 0 && (
        <EmptyState className="mt-4" icon={<PackageSearch />} title="Không có sản phẩm phù hợp" description="Thử đổi từ khóa hoặc bỏ bớt bộ lọc, hoặc thêm sản phẩm mới." />
      )}
      <Pagination page={result.page} totalPages={result.totalPages} basePath="/admin/products" params={params} />
    </>
  );
}
