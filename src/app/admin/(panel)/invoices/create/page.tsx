import type { Metadata } from "next";
import { InvoiceForm } from "@/components/admin/invoice-form";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Tạo hóa đơn" };

export default function CreateInvoicePage() {
  return (
    <>
      <PageHeader
        title="Tạo hóa đơn"
        crumbs={[
          { label: "Hóa đơn", href: "/admin/invoices" },
          { label: "Tạo mới" },
        ]}
      />
      <InvoiceForm />
    </>
  );
}
