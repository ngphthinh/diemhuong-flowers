import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { Skeleton } from "@/components/ui/skeleton";
import { adminListCategories } from "@/features/categories/admin-service";
import { adminGetProduct, adminListProducts } from "@/features/products/admin-service";
import { isObjectId } from "@/lib/api";

export const metadata: Metadata = { title: "Sửa sản phẩm" };

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="h-[32rem]" />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const product = isObjectId(id) ? await adminGetProduct(id) : null;
  if (!product) notFound();
  const [categories, all] = await Promise.all([adminListCategories(), adminListProducts({ sort: "newest", page: 1, pageSize: 100 })]);
  const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, "vi"));
  return (
    <>
      <PageHeader title="Sửa sản phẩm" description={`${product.code} · ${product.name}`}
        crumbs={[{ label: "Sản phẩm", href: "/admin/products" }, { label: product.name, href: `/admin/products/${product.id}` }, { label: "Chỉnh sửa" }]} />
      <ProductForm key={product.updatedAt} product={product} categories={categories.map((c) => ({ id: c.id, name: c.name, isActive: c.isActive }))}
        flowerSuggestions={uniq(all.items.flatMap((p) => p.flowerType))} occasionSuggestions={uniq(all.items.flatMap((p) => p.occasion))} />
    </>
  );
}
