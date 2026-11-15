import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { Skeleton } from "@/components/ui/skeleton";
import { adminListCategories } from "@/features/categories/admin-service";
import { adminListProducts } from "@/features/products/admin-service";

export const metadata: Metadata = { title: "Thêm sản phẩm" };

export default function CreateProductPage() {
  return (
    <>
      <PageHeader title="Thêm sản phẩm" crumbs={[{ label: "Sản phẩm", href: "/admin/products" }, { label: "Thêm mới" }]} />
      <Suspense fallback={<Skeleton className="h-[32rem]" />}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await connection();
  const [categories, all] = await Promise.all([adminListCategories(), adminListProducts({ sort: "newest", page: 1, pageSize: 100 })]);
  const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, "vi"));
  return (
    <ProductForm categories={categories.map((c) => ({ id: c.id, name: c.name, isActive: c.isActive }))}
      flowerSuggestions={uniq(all.items.flatMap((p) => p.flowerType))} occasionSuggestions={uniq(all.items.flatMap((p) => p.occasion))} />
  );
}
