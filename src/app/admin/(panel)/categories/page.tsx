import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { PageHeader } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { adminListCategories } from "@/features/categories/admin-service";

export const metadata: Metadata = { title: "Danh mục" };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader title="Danh mục" description="Nhóm sản phẩm hiển thị trên website" />
      <Suspense fallback={<Skeleton className="h-80" />}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await connection();
  return <CategoriesManager items={await adminListCategories()} />;
}
