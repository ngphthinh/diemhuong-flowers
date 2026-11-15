import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { FolderTree, Inbox, Package, PackageCheck, PackageX } from "lucide-react";
import { Card, ContactStatusBadge, PageHeader, Thumb, formatDateTime } from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";
import { getDashboardStats } from "@/features/dashboard/service";
import { formatVND } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await connection();
  const s = await getDashboardStats();
  const stats = [
    { label: "Tổng sản phẩm", value: s.totalProducts, icon: Package, href: "/admin/products" },
    { label: "Đang hoạt động", value: s.activeProducts, icon: PackageCheck, href: "/admin/products?status=active" },
    { label: "Hết hàng", value: s.outOfStockProducts, icon: PackageX, href: "/admin/products?status=out_of_stock" },
    { label: "Danh mục", value: s.totalCategories, icon: FolderTree, href: "/admin/categories" },
    { label: "Yêu cầu đang chờ", value: s.pendingContacts, icon: Inbox, href: "/admin/contacts?status=PENDING", highlight: s.pendingContacts > 0 },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="Tổng quan cửa hàng"
        actions={<Link href="/admin/products/create" className={buttonVariants()}>Thêm sản phẩm</Link>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, href, highlight }) => (
          <Link key={label} href={href} className="group">
            <Card className={`h-full transition-shadow group-hover:shadow-md ${highlight ? "border-rose/60 bg-rose-soft/40" : ""}`}>
              <Icon className="size-5 text-rose-dark" aria-hidden />
              <p className="mt-3 text-3xl font-semibold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Sản phẩm mới nhất</h2>
            <Link href="/admin/products" className="text-sm text-rose-dark hover:underline">Xem tất cả</Link>
          </div>
          {s.latestProducts.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có sản phẩm.</p> : (
            <ul className="divide-y divide-border">
              {s.latestProducts.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 py-3 hover:bg-muted/50">
                    <Thumb src={p.images[0]} alt={p.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.code} · {p.categoryName}</p>
                    </div>
                    <span className="text-sm font-medium">{formatVND(p.salePrice ?? p.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Yêu cầu liên hệ gần đây</h2>
            <Link href="/admin/contacts" className="text-sm text-rose-dark hover:underline">Xem tất cả</Link>
          </div>
          {s.recentContacts.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có yêu cầu nào.</p> : (
            <ul className="divide-y divide-border">
              {s.recentContacts.map((c) => (
                <li key={c.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{c.customerName}</p>
                    <ContactStatusBadge status={c.status} />
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{c.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.phone} · {formatDateTime(c.createdAt)}{c.product ? ` · ${c.product.name}` : ""}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
