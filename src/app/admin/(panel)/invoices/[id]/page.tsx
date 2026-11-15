import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { PrintButton } from "@/components/admin/print-button";
import { PageHeader, formatDateTime } from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGetInvoice } from "@/features/invoices/admin-service";
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/features/invoices/constants";
import { adminGetSettings } from "@/features/store-settings/admin-service";
import { isObjectId } from "@/lib/api";
import { formatVND } from "@/lib/format";

export const metadata: Metadata = { title: "Chi tiết hóa đơn" };

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-[32rem]" />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const [inv, store] = await Promise.all([
    isObjectId(id) ? adminGetInvoice(id) : null,
    adminGetSettings(),
  ]);
  if (!inv) notFound();

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title={`Hóa đơn ${inv.code}`}
          crumbs={[
            { label: "Hóa đơn", href: "/admin/invoices" },
            { label: inv.code },
          ]}
          actions={
            <>
              <PrintButton />
              <Link href="/admin/invoices/create" className={buttonVariants()}>
                <Plus /> Tạo hóa đơn mới
              </Link>
            </>
          }
        />
      </div>

      <article className="mx-auto max-w-3xl rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8 print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="font-serif text-2xl font-semibold text-brown">
              {store.storeName}
            </p>
            {store.address && (
              <p className="mt-1 text-sm text-muted-foreground">
                {store.address}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {[store.phone, store.email].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold">HÓA ĐƠN</p>
            <p className="text-sm font-medium">{inv.code}</p>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(inv.createdAt)}
            </p>
          </div>
        </header>

        <section className="grid gap-4 py-5 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Khách hàng
            </p>
            <p className="mt-1 font-medium">{inv.customerName}</p>
            {inv.customerPhone && <p>{inv.customerPhone}</p>}
            {inv.customerAddress && <p>{inv.customerAddress}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Thanh toán
            </p>
            <p className="mt-1">{PAYMENT_METHOD_LABEL[inv.paymentMethod]}</p>
            <p className="font-medium">
              {PAYMENT_STATUS_LABEL[inv.paymentStatus]}
            </p>
          </div>
        </section>

        <table className="w-full text-left text-sm">
          <thead className="border-y border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-2 pr-2 font-medium">Sản phẩm</th>
              <th className="px-2 py-2 text-right font-medium">Đơn giá</th>
              <th className="px-2 py-2 text-right font-medium">SL</th>
              <th className="py-2 pl-2 text-right font-medium">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {inv.items.map((i) => (
              <tr key={i.productId}>
                <td className="py-2.5 pr-2">
                  <span className="font-medium">{i.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {i.code}
                  </span>
                </td>
                <td className="px-2 py-2.5 text-right">
                  {formatVND(i.unitPrice)}
                </td>
                <td className="px-2 py-2.5 text-right">{i.quantity}</td>
                <td className="py-2.5 pl-2 text-right font-medium">
                  {formatVND(i.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto mt-5 w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Tạm tính</dt>
            <dd>{formatVND(inv.subtotal)}</dd>
          </div>
          {inv.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Giảm giá</dt>
              <dd>− {formatVND(inv.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <dt>Tổng cộng</dt>
            <dd>{formatVND(inv.total)}</dd>
          </div>
        </dl>

        {inv.note && (
          <p className="mt-6 whitespace-pre-line border-t border-border pt-4 text-sm text-muted-foreground">
            <span className="font-medium text-brown">Ghi chú: </span>
            {inv.note}
          </p>
        )}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Cảm ơn quý khách đã mua hoa tại {store.storeName}!
        </p>
      </article>
    </>
  );
}
