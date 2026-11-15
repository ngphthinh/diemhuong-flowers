import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ExternalLink, Pencil } from "lucide-react";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { Card, PageHeader, Thumb, formatDateTime } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGetProduct } from "@/features/products/admin-service";
import { isObjectId } from "@/lib/api";
import { discountPercent, formatVND } from "@/lib/format";

export const metadata: Metadata = { title: "Chi tiết sản phẩm" };

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="h-[32rem]" />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const p = isObjectId(id) ? await adminGetProduct(id) : null;
  if (!p) notFound();
  const pct = discountPercent(p.price, p.salePrice);

  return (
    <>
      <PageHeader title={p.name} description={`${p.code} · ${p.categoryName}`}
        crumbs={[{ label: "Sản phẩm", href: "/admin/products" }, { label: p.name }]}
        actions={<>
          {p.isActive && <Link href={`/products/${p.slug}`} target="_blank" className={buttonVariants({ variant: "ghost" })}><ExternalLink /> Xem trên website</Link>}
          <Link href={`/admin/products/${p.id}/edit`} className={buttonVariants({ variant: "outline" })}><Pencil /> Sửa</Link>
          <DeleteProductButton id={p.id} name={p.name} />
        </>} />

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card>
          <Thumb src={p.images[0]} alt={p.name} className="aspect-[4/5] size-auto w-full rounded-xl" />
          {p.images.length > 1 && (
            <ul className="mt-3 grid grid-cols-4 gap-2">
              {p.images.slice(1).map((src, i) => <li key={src}><Thumb src={src} alt={`${p.name} — ảnh ${i + 2}`} className="aspect-square size-auto w-full" /></li>)}
            </ul>
          )}
        </Card>

        <Card className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant={p.availability === "IN_STOCK" ? "sage" : "muted"}>{p.availability === "IN_STOCK" ? "Còn hàng" : "Hết hàng"}</Badge>
            <Badge variant={p.isActive ? "sage" : "muted"}>{p.isActive ? "Đang hiển thị" : "Đang ẩn"}</Badge>
            {p.isFeatured && <Badge variant="rose">Nổi bật</Badge>}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Giá</p>
            <p className="text-2xl font-semibold text-rose-dark">
              {formatVND(p.salePrice ?? p.price)}
              {p.salePrice && <span className="ml-3 text-base font-normal text-muted-foreground line-through">{formatVND(p.price)}</span>}
              {pct && <Badge className="ml-3" variant="solid">-{pct}%</Badge>}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Mô tả</p>
            <p className="whitespace-pre-line">{p.description}</p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm text-muted-foreground">Loại hoa</dt><dd>{p.flowerType.join(", ") || "—"}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Dịp phù hợp</dt><dd>{p.occasion.join(", ") || "—"}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Slug</dt><dd className="font-mono text-sm">{p.slug}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Ngày tạo / cập nhật</dt><dd className="text-sm">{formatDateTime(p.createdAt)} / {formatDateTime(p.updatedAt)}</dd></div>
          </dl>
        </Card>
      </div>
    </>
  );
}
