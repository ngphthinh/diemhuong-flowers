import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Plus, Receipt } from "lucide-react";
import { Card, PageHeader, formatDateTime } from "@/components/admin/ui";
import { Pagination } from "@/components/products/pagination";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { adminListInvoices } from "@/features/invoices/admin-service";
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/features/invoices/constants";
import { adminInvoiceQuerySchema } from "@/features/invoices/schema";
import { formatVND } from "@/lib/format";

export const metadata: Metadata = { title: "Hóa đơn" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default function InvoicesPage({ searchParams }: { searchParams: SP }) {
  return (
    <>
      <PageHeader
        title="Hóa đơn"
        description="Danh sách hóa đơn đã lập"
        actions={
          <Link href="/admin/invoices/create" className={buttonVariants()}>
            <Plus /> Tạo hóa đơn
          </Link>
        }
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <List searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function List({ searchParams }: { searchParams: SP }) {
  await connection();
  const raw = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const parsed = adminInvoiceQuerySchema.safeParse(flat);
  const query = parsed.success
    ? parsed.data
    : adminInvoiceQuerySchema.parse({});
  const result = await adminListInvoices(query);

  return (
    <>
      <form action="/admin/invoices" className="mb-4 max-w-md">
        <input
          type="search"
          name="q"
          defaultValue={query.q}
          placeholder="Tìm theo mã, tên khách, SĐT…"
          aria-label="Tìm hóa đơn"
          className="h-11 w-full rounded-xl border border-input bg-white px-4 text-sm focus-visible:border-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/30"
        />
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={<Receipt />}
          title={query.q ? "Không có hóa đơn phù hợp" : "Chưa có hóa đơn nào"}
          description={
            query.q
              ? "Thử đổi từ khóa tìm kiếm."
              : "Tạo hóa đơn đầu tiên cho khách hàng."
          }
          action={
            <Link href="/admin/invoices/create" className={buttonVariants()}>
              <Plus /> Tạo hóa đơn
            </Link>
          }
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Mã</th>
                <th className="px-4 py-3 font-medium">Khách hàng</th>
                <th className="px-4 py-3 font-medium">Ngày tạo</th>
                <th className="px-4 py-3 font-medium">Thanh toán</th>
                <th className="px-4 py-3 text-right font-medium">Tổng tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.items.map((inv) => (
                <tr key={inv.id} className="hover:bg-rose-soft/40">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/admin/invoices/${inv.id}`}
                      className="text-rose-dark hover:underline">
                      {inv.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {inv.customerName}
                    {inv.customerPhone && (
                      <span className="block text-xs text-muted-foreground">
                        {inv.customerPhone}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(inv.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={inv.paymentStatus === "PAID" ? "sage" : "muted"}>
                      {PAYMENT_STATUS_LABEL[inv.paymentStatus]}
                    </Badge>
                    <span className="ml-1 text-xs text-muted-foreground">
                      {PAYMENT_METHOD_LABEL[inv.paymentMethod]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatVND(inv.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath="/admin/invoices"
        params={{ q: query.q }}
      />
    </>
  );
}
